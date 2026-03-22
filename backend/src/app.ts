import 'reflect-metadata';
import express from 'express';
import { DataSource } from 'typeorm';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';

import { DbAdapt } from './db/DbAdapt';
import {
    SysUser,
    BizApproval,
    BizApprovalHistory,
    BizFlowDesign,
    RuTask,
    HiTaskinst,
    RuExecution
} from './db/entities';
import { FlowManager } from './manager/FlowManager';
import { StrategyManager } from './strategy/StrategyManager';
import { createWorkflowRouter } from './api/workflow';
import { createUserRouter } from './api/user';
import { eventBus } from './events/EventBus';
import { workerManager } from './engine/WorkerManager';
import { bpmnParser } from './utils/BpmnParser';

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

eventBus.initialize(io);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const AppDataSource = new DataSource({
    type: 'mssql',
    host: '114.132.77.46',
    port: 1433,
    username: 'sa',
    password: 'zkaps#1',
    database: 'ZKAPS_001_HeTai',
    synchronize: false,
    logging: false,
    options: {
        trustServerCertificate: true,
        encrypt: false
    },
    entities: [
        SysUser,
        BizApproval,
        BizApprovalHistory,
        BizFlowDesign,
        RuTask,
        HiTaskinst,
        RuExecution
    ],
    migrations: [],
    subscribers: []
});

async function initializeWorkers(dbAdapt: DbAdapt) {
    console.log('[Worker] Initializing workers from published workflows...');

    workerManager.setDbAdapt(dbAdapt);

    // 确保 Zeebe 已连接
    try {
        await workerManager.connect();
        console.log('[Worker] Zeebe connected');
    } catch (err) {
        console.error('[Worker] Failed to connect to Zeebe:', err);
    }

    try {
        const flowDesigns = await dbAdapt.listFlowDesigns();
        console.log(`[Worker] Found ${flowDesigns.length} flow designs`);

        const allTaskTypes: string[] = [];

        for (const design of flowDesigns) {
            if (!design.BPMN_XML_) {
                console.log(`[Worker] Flow design ${design.ID_} has no BPMN XML, skipping`);
                continue;
            }

            try {
                console.log(`[Worker] Parsing flow: ${design.ID_}, BPMN_XML length: ${design.BPMN_XML_?.length || 0}`);

                const serviceTasks = await bpmnParser.extractAllTasks(design.BPMN_XML_);
                console.log(`[Worker] Flow ${design.ID_} has ${serviceTasks.length} service tasks:`, serviceTasks.map(s => s.taskType));

                for (const serviceTask of serviceTasks) {
                    if (serviceTask.taskType) {
                        workerManager.createWorkerForTaskType(
                            serviceTask.taskType,
                            design.ID_
                        );
                        if (!allTaskTypes.includes(serviceTask.taskType)) {
                            allTaskTypes.push(serviceTask.taskType);
                        }
                    } 
                }
            } catch (err) {
                console.error(`[Worker] Error processing flow design ${design.ID_}:`, err);
            }
        }

        // 处理残留的Jobs（后端重启时，Zeebe中可能已有未处理的Jobs）
        if (allTaskTypes.length > 0) {
            console.log(`[Worker] All task types: ${allTaskTypes.join(', ')}`);
            await workerManager.handleOrphanedJobs(allTaskTypes);
        }

        console.log('[Worker] Worker initialization complete');
    } catch (err) {
        console.error('[Worker] Failed to initialize workers:', err);
    }
}

async function initializeApp() {
    try {
        await AppDataSource.initialize();
        console.log('Database connection established');

        // 添加新的字段到 ACT_RU_TASK 表（如果不存在）
        try {
            await AppDataSource.query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ACT_RU_TASK') AND name = 'APPROVAL_ID_')
                ALTER TABLE ACT_RU_TASK ADD APPROVAL_ID_ VARCHAR(64) NULL
            `);
            await AppDataSource.query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ACT_RU_TASK') AND name = 'APPROVAL_USER_')
                ALTER TABLE ACT_RU_TASK ADD APPROVAL_USER_ VARCHAR(64) NULL
            `);
            await AppDataSource.query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ACT_RU_TASK') AND name = 'CUSTOM_HEADERS_')
                ALTER TABLE ACT_RU_TASK ADD CUSTOM_HEADERS_ VARCHAR(2000) NULL
            `);
            await AppDataSource.query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ACT_RU_TASK') AND name = 'TASK_STATUS_')
                ALTER TABLE ACT_RU_TASK ADD TASK_STATUS_ NVARCHAR(32) NULL
            `);
            console.log('Database columns checked/added');
        } catch (err) {
            console.log('Error adding columns (may already exist):', err);
        }

        // 将 varchar 列转换为 nvarchar 以支持 Unicode 字符（忽略已转换或无权限的情况）
        try {
            const cols = ['TITLE_', 'APPLICANT_', 'APPLICANT_NAME_', 'BUSINESS_TYPE_', 'DESCRIPTION_', 'STATUS_', 'PROC_INST_ID_', 'CURRENT_NODE_', 'CURRENT_ASSIGNEE_'];
            const sizes: Record<string, string> = {
                'TITLE_': 'NVARCHAR(255)', 'APPLICANT_': 'NVARCHAR(64)', 'APPLICANT_NAME_': 'NVARCHAR(128)',
                'BUSINESS_TYPE_': 'NVARCHAR(64)', 'DESCRIPTION_': 'NVARCHAR(1000)', 'STATUS_': 'NVARCHAR(32)',
                'PROC_INST_ID_': 'NVARCHAR(64)', 'CURRENT_NODE_': 'NVARCHAR(128)', 'CURRENT_ASSIGNEE_': 'NVARCHAR(64)'
            };
            for (const col of cols) {
                try {
                    await AppDataSource.query(`ALTER TABLE ACT_BIZ_APPROVAL ALTER COLUMN ${col} ${sizes[col]}`);
                    console.log(`[DB] Converted ACT_BIZ_APPROVAL.${col} to ${sizes[col]}`);
                } catch (e: any) {
                    if (!e.message.includes('because the same') && !e.message.includes('cannot alter') && !e.message.includes('USE') && !e.message.includes('permission')) {
                        console.log(`[DB] Skipped ACT_BIZ_APPROVAL.${col} (may already be correct or no permission): ${e.message.substring(0, 80)}`);
                    }
                }
            }
            console.log('Database columns converted to nvarchar for Unicode support');
        } catch (err) {
            console.log('Error converting columns:', err);
        }

        try {
            await workerManager.connect();
            console.log('Zeebe worker manager connected');
        } catch (err) {
            console.log('Zeebe not available, continuing without Zeebe worker support');
        }

        // 创建 t_SdOrder 表（如果不存在）
        try {
            await AppDataSource.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 't_SdOrder')
                CREATE TABLE t_SdOrder (
                    ID_ VARCHAR(64) PRIMARY KEY,
                    OrderNo_ VARCHAR(64) NULL,
                    CustomerName_ NVARCHAR(200) NULL,
                    Amount_ DECIMAL(18,2) NULL,
                    OrderDate_ DATETIME NULL,
                    Status_ VARCHAR(20) NULL DEFAULT 'pending',
                    Creator_ NVARCHAR(100) NULL,
                    Approver_ NVARCHAR(100) NULL,
                    Remark_ NVARCHAR(MAX) NULL,
                    CreateTime_ DATETIME NULL DEFAULT GETDATE(),
                    UpdateTime_ DATETIME NULL
                )
            `);
            console.log('Table t_SdOrder created or already exists');
        } catch (err) {
            console.log('Error creating t_SdOrder table:', err);
        }

        const dbAdapt = new DbAdapt(AppDataSource);
        workerManager.setDbAdapt(dbAdapt);

        await initializeWorkers(dbAdapt);

        const flowManager = new FlowManager(dbAdapt);
        const strategyManager = new StrategyManager(flowManager, dbAdapt);

        const workflowRouter = createWorkflowRouter(strategyManager);
        app.use('/api/workflow', workflowRouter);

        const userRouter = createUserRouter(dbAdapt);
        app.use('/api/user', userRouter);

        app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date() });
        });

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            socket.on('subscribe', (processId: string) => {
                socket.join(`process:${processId}`);
                console.log(`Socket ${socket.id} subscribed to process ${processId}`);
            });

            socket.on('unsubscribe', (processId: string) => {
                socket.leave(`process:${processId}`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        const PORT = process.env.PORT || 3000;
        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    }
}





initializeApp();

export { app, httpServer, AppDataSource };
