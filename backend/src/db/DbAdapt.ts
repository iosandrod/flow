import { DataSource } from 'typeorm';
import {
    SysUser,
    BizApproval,
    BizApprovalHistory,
    BizFlowDesign,
    RuTask,
    HiTaskinst,
    RuExecution
} from './entities';
import { ProcessStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface SqlLogEntry {
    sql: string;
    params: any[];
    duration: number;
    error?: string;
}

export class DbAdapt {
    private dataSource: DataSource;
    private sqlLogs: SqlLogEntry[] = [];
    private enableLog: boolean = true;

    constructor(dataSource: DataSource, enableLog: boolean = true) {
        this.dataSource = dataSource;
        this.enableLog = enableLog;
    }

    setEnableLog(enable: boolean): void {
        this.enableLog = enable;
    }

    getSqlLogs(): SqlLogEntry[] {
        return [...this.sqlLogs];
    }

    clearSqlLogs(): void {
        this.sqlLogs = [];
    }

    private inlineParam(sql: string, params: any[]): { sql: string, loggedParams: any[] } {
        let paramIdx = 0;
        const loggedParams: any[] = [];
        const inlined = sql.replace(/@\d+/g, (match) => {
            const val = params[paramIdx++];
            loggedParams.push(val);
            if (val === null || val === undefined) {
                return 'NULL';
            }
            if (typeof val === 'number') {
                return String(val);
            }
            if (typeof val === 'boolean') {
                return val ? '1' : '0';
            }
            return `'${String(val).replace(/'/g, "''")}'`;
        });
        return { sql: inlined, loggedParams };
    }

    private async _execute(sql: string, params: any[] = [], operation: string = 'EXEC'): Promise<any[]> {
        const start = Date.now();
        const { sql: inlinedSql, loggedParams } = this.inlineParam(sql, params);
        try {
            const result = await this.dataSource.query(inlinedSql, []);
            const duration = Date.now() - start;
            if (this.enableLog) {
                const entry: SqlLogEntry = { sql: inlinedSql, params: loggedParams, duration };
                this.sqlLogs.push(entry);
                const paramStr = loggedParams.length > 0 ? `\n  PARAMS: ${JSON.stringify(loggedParams)}` : '';
                const logSql = inlinedSql.replace(/\s+/g, ' ').trim();
                console.log(`[SQL] [${operation}] [${duration}ms] ${logSql}${paramStr}`);
            }
            return result;
        } catch (err: any) {
            const duration = Date.now() - start;
            const entry: SqlLogEntry = { sql: inlinedSql, params: loggedParams, duration, error: err.message };
            this.sqlLogs.push(entry);
            console.error(`[SQL] [${operation}] [${duration}ms] ERROR: ${err.message}`);
            console.error(`[SQL] SQL: ${inlinedSql}`);
            if (loggedParams.length > 0) {
                console.error(`[SQL] PARAMS: ${JSON.stringify(loggedParams)}`);
            }
            throw err;
        }
    }

    async execute(sql: string, params: any[] = []): Promise<any[]> {
        return this._execute(sql, params, 'EXEC');
    }

    async query(sql: string, params: any[] = []): Promise<any[]> {
        return this._execute(sql, params, 'QUERY');
    }

    private rowToEntity<T>(row: any, EntityClass: new () => T): T {
        const entity = new EntityClass() as any;
        Object.assign(entity, row);
        return entity as T;
    }

    private rowsToEntities<T>(rows: any[], EntityClass: new () => T): T[] {
        if (!rows || rows.length === 0) return [];
        return rows.map(row => this.rowToEntity(row, EntityClass));
    }

    async createBizApproval(data: Partial<BizApproval>): Promise<BizApproval> {
        const id = uuidv4();
        await this.execute(`
            INSERT INTO ACT_BIZ_APPROVAL
                (ID_, TITLE_, AMOUNT_, APPLICANT_, APPLICANT_NAME_, BUSINESS_TYPE_, DESCRIPTION_,
                 STATUS_, PROC_INST_ID_, CURRENT_NODE_, CURRENT_ASSIGNEE_, FORM_DATA_, CREATE_TIME_, UPDATE_TIME_)
            VALUES (@1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, GETDATE(), GETDATE())
        `, [
            id,
            data.TITLE_ || '',
            data.AMOUNT_ ?? 0,
            String(data.APPLICANT_ || ''),
            data.APPLICANT_NAME_ || '',
            data.BUSINESS_TYPE_ || '',
            data.DESCRIPTION_ || '',
            ProcessStatus.NEW,
            data.PROC_INST_ID_ || '',
            data.CURRENT_NODE_ || '',
            data.CURRENT_ASSIGNEE_ || '',
            data.FORM_DATA_ || ''
        ]);
        const result = await this.getBizApproval(id);
        if (!result) throw new Error('Failed to create BizApproval');
        return result;
    }

    async updateBizApproval(id: string, data: Partial<BizApproval>): Promise<BizApproval | null> {
        const entries = Object.entries(data).filter(([, v]) => v !== undefined);
        if (entries.length === 0) return this.getBizApproval(id);
        const sets = entries.map(([, ], i) => `${entries[i][0]} = @${i + 2}`).join(', ');
        const vals = entries.map(([, v]) => v);
        await this.execute(
            `UPDATE ACT_BIZ_APPROVAL SET ${sets}, UPDATE_TIME_ = GETDATE() WHERE ID_ = @1`,
            [id, ...vals]
        );
        return this.getBizApproval(id);
    }

    async getBizApproval(id: string): Promise<BizApproval | null> {
        const rows = await this.query(
            `SELECT * FROM ACT_BIZ_APPROVAL WHERE ID_ = @1`,
            [id]
        );
        return rows.length > 0 ? this.rowToEntity(rows[0], BizApproval) : null;
    }

    async getBizApprovalByProcInstId(procInstId: string): Promise<BizApproval | null> {
        const rows = await this.query(
            `SELECT * FROM ACT_BIZ_APPROVAL WHERE PROC_INST_ID_ = @1`,
            [procInstId]
        );
        return rows.length > 0 ? this.rowToEntity(rows[0], BizApproval) : null;
    }

    async listBizApprovals(userId?: string | number): Promise<BizApproval[]> {
        if (userId) {
            const rows = await this.query(
                `SELECT * FROM ACT_BIZ_APPROVAL WHERE APPLICANT_ = @1 ORDER BY CREATE_TIME_ DESC`,
                [String(userId)]
            );
            return this.rowsToEntities(rows, BizApproval);
        }
        const rows = await this.query(
            `SELECT * FROM ACT_BIZ_APPROVAL ORDER BY CREATE_TIME_ DESC`
        );
        return this.rowsToEntities(rows, BizApproval);
    }

    async listApprovalHistory(limit: number = 50): Promise<BizApprovalHistory[]> {
        const rows = await this.query(
            `SELECT TOP ${limit} * FROM ACT_BIZ_APPROVAL_HISTORY ORDER BY CREATE_TIME_ DESC`
        );
        return this.rowsToEntities(rows, BizApprovalHistory);
    }

    async addApprovalHistory(data: Partial<BizApprovalHistory>): Promise<BizApprovalHistory> {
        const id = uuidv4();
        await this.execute(`
            INSERT INTO ACT_BIZ_APPROVAL_HISTORY
                (ID_, APPROVAL_ID_, PROC_INST_ID_, TASK_ID_, TASK_NAME_, TASK_DEF_KEY_,
                 ASSIGNEE_, ASSIGNEE_NAME_, ACTION_, COMMENT_, CREATE_TIME_)
            VALUES (@1, @2, @3, @4, @5, @6, @7, @8, @9, @10, GETDATE())
        `, [
            id,
            data.APPROVAL_ID_,
            data.PROC_INST_ID_,
            data.TASK_ID_,
            data.TASK_NAME_,
            data.TASK_DEF_KEY_,
            data.ASSIGNEE_,
            data.ASSIGNEE_NAME_,
            data.ACTION_,
            data.COMMENT_
        ]);
        const rows = await this.query(`SELECT * FROM ACT_BIZ_APPROVAL_HISTORY WHERE ID_ = @1`, [id]);
        return this.rowToEntity(rows[0], BizApprovalHistory);
    }

    async getApprovalHistory(approvalId: string): Promise<BizApprovalHistory[]> {
        const rows = await this.query(
            `SELECT * FROM ACT_BIZ_APPROVAL_HISTORY WHERE APPROVAL_ID_ = @1 ORDER BY CREATE_TIME_ ASC`,
            [approvalId]
        );
        return this.rowsToEntities(rows, BizApprovalHistory);
    }

    async createFlowDesign(data: Partial<BizFlowDesign>): Promise<BizFlowDesign> {
        const id = data.ID_ || uuidv4();
        await this.execute(`
            INSERT INTO ACT_BIZ_FLOW_DESIGN
                (ID_, NAME_, BPMN_XML_, STATUS_, VERSION_, CREATE_USER_, UPDATE_USER_, CREATE_TIME_, UPDATE_TIME_)
            VALUES (@1, @2, @3, @4, @5, @6, @7, GETDATE(), GETDATE())
        `, [
            id,
            data.NAME_,
            data.BPMN_XML_,
            data.STATUS_ || 'DRAFT',
            data.VERSION_ || 1,
            data.CREATE_USER_ || 'system',
            data.UPDATE_USER_ || 'system'
        ]);
        const result = await this.getFlowDesignByKey(id);
        if (!result) throw new Error('Failed to create flow design');
        return result;
    }

    async updateFlowDesign(id: string, data: Partial<BizFlowDesign>): Promise<BizFlowDesign | null> {
        const entries = Object.entries(data).filter(([, v]) => v !== undefined);
        if (entries.length === 0) return this.getFlowDesignByKey(id);
        const sets = entries.map(([, ], i) => `${entries[i][0]} = @${i + 2}`).join(', ');
        const vals = entries.map(([, v]) => v);
        await this.execute(
            `UPDATE ACT_BIZ_FLOW_DESIGN SET ${sets}, UPDATE_TIME_ = GETDATE() WHERE ID_ = @1`,
            [id, ...vals]
        );
        return this.getFlowDesignByKey(id);
    }

    async getFlowDesign(id: string): Promise<BizFlowDesign | null> {
        return this.getFlowDesignByKey(id);
    }

    async getFlowDesignByKey(key: string): Promise<BizFlowDesign | null> {
        const rows = await this.query(
            `SELECT * FROM ACT_BIZ_FLOW_DESIGN WHERE ID_ = @1`,
            [key]
        );
        return rows.length > 0 ? this.rowToEntity(rows[0], BizFlowDesign) : null;
    }

    async listFlowDesigns(): Promise<BizFlowDesign[]> {
        const rows = await this.query(`SELECT * FROM ACT_BIZ_FLOW_DESIGN`);
        if (!rows || rows.length === 0) return [];
        return this.rowsToEntities(rows, BizFlowDesign);
    }

    async deleteFlowDesign(id: string): Promise<void> {
        await this.execute(`DELETE FROM ACT_BIZ_FLOW_DESIGN WHERE ID_ = @1`, [id]);
    }

    async createExecution(data: Partial<RuExecution>): Promise<RuExecution> {
        const id = data.ID_ || uuidv4();
        await this.execute(`
            INSERT INTO ACT_RU_EXECUTION
                (ID_, REV_, ROOT_PROC_INST_ID_, PROC_INST_ID_, BUSINESS_KEY_, PARENT_ID_,
                 SUPER_EXECUTION_, SUPER_PROCESS_INSTANCE_ID_, EXECUTION_ID_, PROCESS_DEF_ID_,
                 PROCESS_DEF_KEY_, ACTIVITY_ID_, START_ACTIVITY_ID_, START_TIME_, END_TIME_,
                 DURATION_, STATE_, END_ACTIVITY_ID_, TENANT_ID_, PRIORITY_)
            VALUES (@1, 1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, GETDATE(), NULL, 0, 'ACTIVE', '', @13, 50)
        `, [
            id,
            data.ROOT_PROC_INST_ID_ || data.PROC_INST_ID_,
            data.PROC_INST_ID_,
            data.BUSINESS_KEY_,
            data.PARENT_ID_ || '',
            data.SUPER_EXECUTION_ || '',
            data.SUPER_PROCESS_INSTANCE_ID_ || '',
            data.EXECUTION_ID_ || uuidv4(),
            data.PROCESS_DEF_ID_,
            data.PROCESS_DEF_KEY_,
            data.ACTIVITY_ID_ || '',
            data.START_ACTIVITY_ID_ || '',
            data.TENANT_ID_ || ''
        ]);
        const rows = await this.query(`SELECT * FROM ACT_RU_EXECUTION WHERE ID_ = @1`, [id]);
        return this.rowToEntity(rows[0], RuExecution);
    }

    async updateExecution(id: string, data: Partial<RuExecution>): Promise<RuExecution | null> {
        const entries = Object.entries(data).filter(([k, v]) => v !== undefined && k !== 'ID_' && k !== 'REV_');
        if (entries.length === 0) return this.getExecution(id);
        const sets = entries.map(([, ], i) => {
            const key = entries[i][0];
            return key === 'REV_' ? 'REV_ = REV_ + 1' : `${key} = @${i + 2}`;
        }).join(', ');
        const vals = entries.filter(([k]) => k !== 'REV_').map(([, v]) => v);
        await this.execute(
            `UPDATE ACT_RU_EXECUTION SET ${sets} WHERE ID_ = @1`,
            [id, ...vals]
        );
        return this.getExecution(id);
    }

    async getExecution(id: string): Promise<RuExecution | null> {
        const rows = await this.query(`SELECT * FROM ACT_RU_EXECUTION WHERE ID_ = @1`, [id]);
        return rows.length > 0 ? this.rowToEntity(rows[0], RuExecution) : null;
    }

    async getExecutionByProcInstId(procInstId: string): Promise<RuExecution | null> {
        const rows = await this.query(
            `SELECT * FROM ACT_RU_EXECUTION WHERE PROC_INST_ID_ = @1`,
            [procInstId]
        );
        return rows.length > 0 ? this.rowToEntity(rows[0], RuExecution) : null;
    }

    async completeExecution(id: string): Promise<void> {
        await this.execute(`
            UPDATE ACT_RU_EXECUTION
            SET END_TIME_ = GETDATE(), STATE_ = 'COMPLETED', REV_ = REV_ + 1
            WHERE ID_ = @1
        `, [id]);
    }

    async createTask(data: Partial<RuTask>): Promise<RuTask> {
        const id = data.ID_ || uuidv4();
        let customHeaders = (data as any).customHeaders || (data as any).CUSTOM_HEADERS_;
        const customHeadersJson = customHeaders
            ? (typeof customHeaders === 'string' ? customHeaders : JSON.stringify(customHeaders))
            : null;
        let approvalUser: string | null = null;
        if (customHeaders) {
            if (typeof customHeaders === 'object') {
                approvalUser = customHeaders.user || customHeaders.User || null;
            } else if (typeof customHeaders === 'string') {
                try {
                    const parsed = JSON.parse(customHeaders);
                    approvalUser = parsed.user || parsed.User || null;
                } catch { }
            }
        }
        await this.execute(`
            INSERT INTO ACT_RU_TASK
                (ID_, REV_, EXECUTION_ID_, PROC_INST_ID_, PROC_DEF_ID_, PROC_DEF_KEY_,
                 TASK_DEF_ID_, TASK_DEF_KEY_, NAME_, PARENT_TASK_ID_, DESCRIPTION_, OWNER_,
                 ASSIGNEE_, START_TIME_, END_TIME_, DURATION_, PRIORITY_, DUE_DATE_, CATEGORY_,
                 SUSPENSION_STATE_, TENANT_ID_, FORM_KEY_, TASK_KEY_, APPROVAL_ID_, APPROVAL_USER_, CUSTOM_HEADERS_)
            VALUES (@1, 1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, GETDATE(), NULL, 0, @13, @14, @15, 1, @16, @17, @18, @19, @20, @21)
        `, [
            id,
            data.EXECUTION_ID_,
            data.PROC_INST_ID_,
            data.PROC_DEF_ID_,
            data.PROC_DEF_KEY_,
            data.TASK_DEF_ID_,
            data.TASK_DEF_KEY_,
            data.NAME_,
            data.PARENT_TASK_ID_,
            data.DESCRIPTION_ || null,
            data.OWNER_,
            data.ASSIGNEE_,
            data.PRIORITY_ || 50,
            data.DUE_DATE_,
            data.CATEGORY_,
            data.TENANT_ID_,
            data.FORM_KEY_,
            data.TASK_KEY_,
            data.DESCRIPTION_ || null,
            approvalUser,
            customHeadersJson
        ]);
        const rows = await this.query(`SELECT * FROM ACT_RU_TASK WHERE ID_ = @1`, [id]);
        return this.rowToEntity(rows[0], RuTask);
    }

    async completeTask(id: string, data?: Partial<RuTask>): Promise<RuTask | null> {
        await this.execute(`
            UPDATE ACT_RU_TASK
            SET END_TIME_ = GETDATE(), DURATION_ = 0, REV_ = REV_ + 1
            WHERE ID_ = @1
        `, [id]);

        if (data) {
            const entries = Object.entries(data).filter(([k, v]) => v !== undefined && k !== 'ID_' && k !== 'REV_');
            if (entries.length > 0) {
                const sets = entries.map(([, ], i) => `${entries[i][0]} = @${i + 2}`).join(', ');
                const vals = entries.map(([, v]) => v);
                await this.execute(
                    `UPDATE ACT_RU_TASK SET ${sets} WHERE ID_ = @1`,
                    [id, ...vals]
                );
            }
        }
        return this.getTask(id);
    }

    async getTask(id: string): Promise<RuTask | null> {
        const rows = await this.query(`SELECT * FROM ACT_RU_TASK WHERE ID_ = @1`, [id]);
        return rows.length > 0 ? this.rowToEntity(rows[0], RuTask) : null;
    }

    async getPendingTasks(procInstId?: string): Promise<RuTask[]> {
        if (procInstId) {
            const rows = await this.query(
                `SELECT * FROM ACT_RU_TASK WHERE END_TIME_ IS NULL AND PROC_INST_ID_ = @1 ORDER BY START_TIME_ DESC`,
                [procInstId]
            );
            return this.rowsToEntities(rows, RuTask);
        }
        const rows = await this.query(
            `SELECT * FROM ACT_RU_TASK WHERE END_TIME_ IS NULL ORDER BY START_TIME_ DESC`
        );
        return this.rowsToEntities(rows, RuTask);
    }

    async checkTaskExists(procInstId: string, taskDefKey: string): Promise<boolean> {
        const rows = await this.query(
            `SELECT 1 FROM ACT_RU_TASK WHERE PROC_INST_ID_ = @1 AND TASK_DEF_KEY_ = @2 AND END_TIME_ IS NULL`,
            [procInstId, taskDefKey]
        );
        return rows.length > 0;
    }

    async checkTaskExistsByJobKey(jobKey: string): Promise<boolean> {
        const rows = await this.query(
            `SELECT 1 FROM ACT_RU_TASK WHERE TASK_KEY_ = @1 AND END_TIME_ IS NULL`,
            [jobKey]
        );
        return rows.length > 0;
    }

    async getUserTasks(userName?: string): Promise<RuTask[]> {
        console.log('[getUserTasks] userName:', userName);
        let rows: any[];
        if (userName && userName.trim()) {
            const name = userName.trim();
            console.log('[getUserTasks] Filtering by user:', name);
            rows = await this.query(
                `SELECT * FROM ACT_RU_TASK WHERE END_TIME_ IS NULL AND (APPROVAL_USER_ = @1 OR ASSIGNEE_ = @1) ORDER BY START_TIME_ DESC`,
                [name]
            );
            console.log('[getUserTasks] Found', rows.length, 'tasks');
        } else {
            console.log('[getUserTasks] No userName, returning all pending tasks');
            rows = await this.query(
                `SELECT * FROM ACT_RU_TASK WHERE END_TIME_ IS NULL ORDER BY START_TIME_ DESC`
            );
            console.log('[getUserTasks] Found', rows.length, 'tasks (no filter)');
        }
        return this.rowsToEntities(rows, RuTask);
    }

    async getAllPendingTasks(): Promise<RuTask[]> {
        const rows = await this.query(
            `SELECT * FROM ACT_RU_TASK WHERE END_TIME_ IS NULL ORDER BY START_TIME_ DESC`
        );
        return this.rowsToEntities(rows, RuTask);
    }

    async getAllTasksByProcess(procInstId: string): Promise<RuTask[]> {
        const rows = await this.query(
            `SELECT * FROM ACT_RU_TASK WHERE PROC_INST_ID_ = @1 ORDER BY START_TIME_ ASC`,
            [procInstId]
        );
        return this.rowsToEntities(rows, RuTask);
    }

    async addTaskHistory(data: Partial<HiTaskinst>): Promise<HiTaskinst> {
        const id = data.ID_ || uuidv4();
        await this.execute(`
            INSERT INTO ACT_HI_TASKINST
                (ID_, PROC_DEF_KEY_, PROC_DEF_ID_, PROC_INST_ID_, EXECUTION_ID_, TASK_DEF_ID_,
                 TASK_DEF_KEY_, NAME_, PARENT_TASK_ID_, DESCRIPTION_, OWNER_, ASSIGNEE_,
                 START_TIME_, END_TIME_, DURATION_, DELETE_REASON_, PRIORITY_, DUE_DATE_,
                 FORM_KEY_, CATEGORY_, TENANT_ID_)
            VALUES (@1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17, @18, @19, @20, @21)
        `, [
            id,
            data.PROC_DEF_KEY_,
            data.PROC_DEF_ID_,
            data.PROC_INST_ID_,
            data.EXECUTION_ID_,
            data.TASK_DEF_ID_,
            data.TASK_DEF_KEY_,
            data.NAME_,
            data.PARENT_TASK_ID_,
            data.DESCRIPTION_,
            data.OWNER_,
            data.ASSIGNEE_,
            data.START_TIME_ || new Date().toISOString(),
            data.END_TIME_,
            data.DURATION_,
            data.DELETE_REASON_,
            data.PRIORITY_ || 50,
            data.DUE_DATE_,
            data.FORM_KEY_,
            data.CATEGORY_,
            data.TENANT_ID_
        ]);
        const rows = await this.query(`SELECT * FROM ACT_HI_TASKINST WHERE ID_ = @1`, [id]);
        return this.rowToEntity(rows[0], HiTaskinst);
    }

    async getProcessHistory(procInstId: string): Promise<HiTaskinst[]> {
        const rows = await this.query(
            `SELECT * FROM ACT_HI_TASKINST WHERE PROC_INST_ID_ = @1 ORDER BY START_TIME_ ASC`,
            [procInstId]
        );
        return this.rowsToEntities(rows, HiTaskinst);
    }

    async getUser(userId: string): Promise<SysUser | null> {
        const rows = await this.query(`SELECT * FROM Sys_User WHERE User_Id = @1`, [userId]);
        return rows.length > 0 ? this.rowToEntity(rows[0], SysUser) : null;
    }

    async getUserByName(userName: string): Promise<SysUser | null> {
        const rows = await this.query(`SELECT * FROM Sys_User WHERE UserName = @1`, [userName]);
        return rows.length > 0 ? this.rowToEntity(rows[0], SysUser) : null;
    }

    async getAllUsers(): Promise<SysUser[]> {
        const rows = await this.query(`SELECT * FROM Sys_User WHERE Enable = 1`);
        return this.rowsToEntities(rows, SysUser);
    }

    async queryByTable(tableName: string): Promise<any[]> {
        try {
            if (!/^[A-Za-z0-9_]+$/.test(tableName)) {
                throw new Error('Invalid table name');
            }
            return await this.query(`SELECT * FROM ${tableName} ORDER BY CREATE_TIME DESC`);
        } catch (error: any) {
            console.error(`[DbAdapt] Query table ${tableName} failed:`, error.message);
            return [];
        }
    }

    async insert(tableName: string, data: Record<string, any>): Promise<string> {
        if (!/^[A-Za-z0-9_]+$/.test(tableName)) {
            throw new Error('Invalid table name');
        }
        const id = uuidv4();
        const keys = Object.keys(data);
        const columns = ['ID_', ...keys];
        const values = [id, ...keys.map(k => data[k])];
        const placeholders = columns.map((_, i) => `@${i + 1}`).join(', ');
        const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        await this.execute(query, values);
        return id;
    }

    async updateById(tableName: string, id: string, data: Record<string, any>): Promise<void> {
        if (!/^[A-Za-z0-9_]+$/.test(tableName)) {
            throw new Error('Invalid table name');
        }
        const keys = Object.keys(data);
        const setClause = keys.map((k, i) => `${k} = @${i + 2}`).join(', ');
        const query = `UPDATE ${tableName} SET ${setClause} WHERE ID_ = @1`;
        const values = [id, ...keys.map(k => data[k])];
        await this.execute(query, values);
    }

    async transaction<T>(callback: (manager: any) => Promise<T>): Promise<T> {
        return this.dataSource.transaction(callback);
    }
}

export * from './entities';
