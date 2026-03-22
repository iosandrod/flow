import { ZBClient, ZBWorker, ZeebeJob } from 'zeebe-node';
import { DbAdapt } from '../db/DbAdapt';

export interface JobCompleteData {
    jobKey: string;
    variables: Record<string, any>;
}

export interface PendingTask {
    job: ZeebeJob<any>;
    taskId: string;
    procInstId: string;
    taskType: string;
    nodeId: string;
    createTime: Date;
    _manual?: boolean;
}

export class WorkerManager {
    private zc: ZBClient | null = null;
    private workers: Map<string, ZBWorker<any, any, any>> = new Map();
    private jobCompletors: Map<string, (data: JobCompleteData) => void> = new Map();
    private jobMap: Map<string, ZeebeJob<any>> = new Map();
    private pendingTasks: Map<string, PendingTask> = new Map();
    private gatewayAddress: string;
    private dbAdapt: DbAdapt | null = null;

    constructor(gatewayAddress: string = process.env.ZEEBE_ADDRESS || 'localhost:26500') {
        this.gatewayAddress = gatewayAddress;
    }

    setDbAdapt(dbAdapt: DbAdapt): void {
        this.dbAdapt = dbAdapt;
    }

    async connect(): Promise<void> {
        if (!this.zc) {
            this.zc = new ZBClient(this.gatewayAddress, {
                longPoll: 60000,
                pollInterval: 500
            });
        }
    }

    async handleOrphanedJobs(taskTypes: string[]): Promise<void> {
        if (!this.zc) {
            console.log('[Worker] Zeebe client not connected, skipping orphaned jobs handling');
            return;
        }

        console.log(`[Worker] Checking for orphaned jobs for task types: ${taskTypes.join(', ')}`);

        for (const taskType of taskTypes) {
            try {
                const jobs = await Promise.race([
                    this.zc.activateJobs({
                        maxJobsToActivate: 100,
                        timeout: 500,
                        type: taskType,
                        worker: 'orphan-handler',
                        requestTimeout: 500
                    }),
                    new Promise<any[]>((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), 600)
                    )
                ]) as any[];

                if (jobs && jobs.length > 0) {
                    console.log(`[Worker] Found ${jobs.length} orphaned jobs for ${taskType}`);
                    for (const job of jobs) {
                        try {
                            const zeebeJob = job as unknown as ZeebeJob<any>;
                            await this.createPendingTask(zeebeJob, taskType, job.elementId);
                            await this.zc.completeJob({
                                jobKey: job.key,
                                variables: { _orphaned: true }
                            });
                            console.log(`[Worker] Completed orphaned job: ${job.key}`);
                        } catch (err) {
                            console.error(`[Worker] Error processing orphaned job ${job.key}:`, err);
                        }
                    }
                } else {
                    console.log(`[Worker] No orphaned jobs found for ${taskType}`);
                }
            } catch (err: any) {
                if (err?.message === 'Timeout') {
                    console.log(`[Worker] No orphaned jobs for ${taskType} (timeout after 5s)`);
                } else {
                    console.error(`[Worker] Error activating jobs for ${taskType}:`, err);
                }
            }
        }
    }

    createWorkerForTaskType(taskType: string, processId: string): void {
        if (!this.zc) {
            throw new Error('Zeebe client not connected');
        }

        if (this.workers.has(taskType)) {
            console.log(`Worker for ${taskType} already exists, skipping`);
            return;
        }

        console.log(`${taskType}已经被监听`);

        const worker = this.zc.createWorker({
            taskType: taskType,
            taskHandler: async (job: ZeebeJob<any>) => {
                console.log(`[Worker] ====== HANDLER INVOKED ======`);
                console.log(`[Worker] taskType=${taskType}, job.key=${job.key}, processInstanceKey=${job.processInstanceKey}, elementId=${job.elementId}`);

                try {
                    const taskId = await this.createPendingTask(job, taskType, job.elementId);
                    console.log(`[Worker] ====== HANDLER COMPLETE ====== taskId=${taskId}`);
                } catch (err: any) {
                    console.error(`[Worker] HANDLER ERROR:`, err.message, err.stack);
                }

                return 'JOB_ACTION_ACKNOWLEDGEMENT' as const;
            }
        });

        this.workers.set(taskType, worker);
        console.log(`[Worker] Created worker for task type: ${taskType}`);
    }

    private async withRetry<T>(fn: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> {
        let lastError: any;
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (err: any) {
                lastError = err;
                const isConnError = err?.message?.includes('connect') || err?.message?.includes('ConnectionError') || err?.message?.includes('ECONNREFUSED') || err?.message?.includes('ETIMEDOUT') || err?.message?.includes('Failed to connect');
                if (isConnError && i < retries - 1) {
                    console.log(`[Worker] DB operation failed (attempt ${i + 1}/${retries}), retrying in ${delay}ms: ${err.message}`);
                    await new Promise(r => setTimeout(r, delay));
                    delay *= 2;
                } else {
                    throw err;
                }
            }
        }
        throw lastError;
    }

    async createPendingTask(job: ZeebeJob<any>, taskType: string, nodeId: string): Promise<string> {
        if (!this.dbAdapt) {
            throw new Error('DbAdapt not set');
        }

        const variables = job.variables;
        console.log(`[Worker] createPendingTask: job=${job.key}, processInstanceKey=${job.processInstanceKey}, taskType=${taskType}, nodeId=${nodeId}`);
        console.log(`[Worker] variables:`, JSON.stringify(variables));

        const procInstId = String(job.processInstanceKey);
        const approvalId = variables.approvalId;
        let approval = null;

        console.log(`[Worker] Looking for approvalId:`, approvalId);

        if (approvalId) {
            approval = await this.withRetry(() => this.dbAdapt!.getBizApproval(approvalId));
            console.log(`[Worker] Found approval:`, approval ? approval.ID_ : 'null');
        }

        if (!approval) {
            console.log(`[Worker] No approval found for job ${job.key}, skipping task creation`);
            return '';
        }

        const jobKeyExists = await this.withRetry(() => this.dbAdapt!.checkTaskExistsByJobKey(String(job.key)));
        if (jobKeyExists) {
            console.log(`[Worker] Task already exists for job ${job.key}, skipping`);
            return '';
        }

        const customHeaders = job.customHeaders || {};
        const headerUserName = customHeaders.user || customHeaders.User || '';
        let assignee = variables.assignee || '';

        if (!assignee && headerUserName) {
            const user = await this.withRetry(() => this.dbAdapt!.getUserByName(headerUserName));
            if (user) {
                assignee = String(user.User_Id);
                console.log(`[Worker] Using taskHeaders user ${headerUserName} -> User_Id: ${assignee}`);
            }
        }

        if (!assignee) {
            assignee = variables.applicant || variables.starterId || '1';
        }

        const task = await this.withRetry(() => this.dbAdapt!.createTask({
            PROC_INST_ID_: procInstId,
            PROC_DEF_KEY_: variables.processKey || taskType,
            TASK_DEF_KEY_: nodeId,
            NAME_: variables.nodeName || nodeId,
            ASSIGNEE_: assignee,
            TASK_KEY_: String(job.key),
            DESCRIPTION_: approvalId || '',
            customHeaders: { ...customHeaders }
        } as any));

        await this.withRetry(() => this.dbAdapt!.updateTaskStatus(task.ID_, 'A'));

        const pendingTask: PendingTask = {
            job: job,
            taskId: task.ID_,
            procInstId: procInstId,
            taskType: taskType,
            nodeId: nodeId,
            createTime: new Date()
        };

        this.pendingTasks.set(task.ID_, pendingTask);
        console.log(`[Worker] Created pending task ${task.ID_} for job ${job.key}`);

        return task.ID_;
    }

    async completePendingTask(taskId: string, userId: string, comment?: string, variables?: Record<string, any>): Promise<any> {
        const pendingTask = this.pendingTasks.get(taskId);
        const db = this.dbAdapt!;
        if (!pendingTask) {
            console.log(`[Worker] Task ${taskId} not in pendingTasks, falling back to DB lookup`);

            const dbTask = await this.withRetry(() => db.getTask(taskId));
            if (!dbTask) {
                throw new Error(`Task not found in DB: ${taskId}`);
            }

            const procInstId = dbTask.PROC_INST_ID_;
            const taskKey = dbTask.TASK_KEY_;

            const approval = await this.withRetry(() => db.getBizApprovalByProcInstId(procInstId));
            if (approval) {
                await this.withRetry(() => db.addApprovalHistory({
                    APPROVAL_ID_: approval.ID_,
                    PROC_INST_ID_: procInstId,
                    TASK_ID_: taskId,
                    TASK_NAME_: dbTask.NAME_,
                    TASK_DEF_KEY_: dbTask.TASK_DEF_KEY_,
                    ASSIGNEE_: userId,
                    ACTION_: 'approve',
                    COMMENT_: comment
                }));

                await this.withRetry(() => db.updateBizApproval(approval.ID_, {
                    CURRENT_NODE_: dbTask.TASK_DEF_KEY_,
                    CURRENT_ASSIGNEE_: userId,
                    FORM_DATA_: variables ? JSON.stringify(variables) : undefined
                }));
            }

            if (!taskKey) {
                console.log(`[Worker] Task ${taskId} has no TASK_KEY_, skipping Zeebe job completion`);
                return { taskId, procInstId, message: 'Task completed (no job key)' };
            }

            if (!this.zc) {
                throw new Error('Zeebe client not connected');
            }//
            try {
                await this.zc.completeJob({
                    jobKey: taskKey,
                    variables: {
                        _approvedBy: userId,
                        _approvalComment: comment,
                        ...(variables || {})
                    }
                });
                console.log(`[Worker] Completed Zeebe job ${taskKey} for task ${taskId} via DB fallback`);
            } catch (err: any) {
                const isNotFound = err?.message?.includes('NOT_FOUND') || err?.code === 'NOT_FOUND' || err?.status === 404;
                if (isNotFound) {
                    console.log(`[Worker] Zeebe job ${taskKey} already completed (NOT_FOUND) — skipping job completion, proceeding with DB updates`);
                } else {
                    console.error(`[Worker] Failed to complete Zeebe job ${taskKey}:`, err.message);
                    throw err;
                }
            }
            return { taskId, jobKey: taskKey, procInstId, message: 'Task completed via DB fallback' };
        }//
        const { job, procInstId, taskType, nodeId, _manual } = pendingTask;
        //
        if (_manual || !job?.key) {
            console.log(`[Worker] Task ${taskId} is manually created, skipping job.complete()`);
            this.pendingTasks.delete(taskId);
            return { taskId, procInstId, message: 'Manual task completed' };
        }

        const approval = await this.withRetry(() => db.getBizApprovalByProcInstId(procInstId));

        if (approval) {
            await this.withRetry(() => db.addApprovalHistory({
                APPROVAL_ID_: approval.ID_,
                PROC_INST_ID_: procInstId,
                TASK_ID_: taskId,
                TASK_NAME_: pendingTask.job.variables.nodeName || nodeId,
                TASK_DEF_KEY_: nodeId,
                ASSIGNEE_: userId,
                ACTION_: 'approve',
                COMMENT_: comment
            }));

            await this.withRetry(() => db.updateBizApproval(approval.ID_, {
                CURRENT_NODE_: nodeId,
                CURRENT_ASSIGNEE_: userId,
                FORM_DATA_: variables ? JSON.stringify(variables) : undefined
            }));
        }

        try {
            const completeVars = {
                ...job.variables,
                ...variables,
                _approvedBy: userId,
                _approvalComment: comment
            };
            console.log(`[Worker] Completing job ${job.key} with variables:`, JSON.stringify(completeVars));
            await job.complete(completeVars);
            console.log(`[Worker] Completed job ${job.key} for task ${taskId}`);
        } catch (err: any) {
            const isNotFound = err?.message?.includes('NOT_FOUND') || err?.code === 'NOT_FOUND' || err?.status === 404;
            if (isNotFound) {
                console.log(`[Worker] Zeebe job ${job.key} already completed (NOT_FOUND) — job was likely completed by handleOrphanedJobs on startup`);
            } else {
                console.error(`[Worker] Failed to complete job ${job.key}:`, err);
            }
        }

        this.pendingTasks.delete(taskId);

        return {
            taskId,
            jobKey: job.key,
            procInstId,
            message: 'Task completed and job signaled'
        };
    }

    getPendingTask(taskId: string): PendingTask | undefined {
        return this.pendingTasks.get(taskId);
    }

    getAllPendingTasks(): PendingTask[] {
        return Array.from(this.pendingTasks.values());
    }

    completeJob(jobKey: string, variables: Record<string, any>): void {
        const completor = this.jobCompletors.get(jobKey);
        if (completor) {
            completor({ jobKey, variables });
            this.jobCompletors.delete(jobKey);
        }
    }

    registerJobCompletor(jobKey: string, completor: (data: JobCompleteData) => void): void {
        this.jobCompletors.set(jobKey, completor);
    }

    cancelWorker(processId: string, taskType: string): void {
        const workerKey = `${processId}:${taskType}`;
        const worker = this.workers.get(workerKey);
        if (worker) {
            worker.close();
            this.workers.delete(workerKey);
            console.log(`[Worker] Cancelled worker for ${taskType}`);
        }
    }

    cancelAllWorkers(processId: string): void {
        for (const [key, worker] of this.workers.entries()) {
            if (key.startsWith(processId)) {
                worker.close();
                this.workers.delete(key);
            }
        }
        console.log(`[Worker] Cancelled all workers for process: ${processId}`);
    }

    close(): void {
        for (const worker of this.workers.values()) {
            worker.close();
        }
        this.workers.clear();
        this.jobCompletors.clear();
        this.pendingTasks.clear();
    }
}

export const workerManager = new WorkerManager();
