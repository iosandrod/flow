/**
 * flowable-backend - 工作流引擎核心模块
 * 
 * 导出内容：
 * - FlowManager: 流程管理核心类
 * - WorkerManager: Worker管理类
 * - EngineRunner: Zeebe引擎运行器
 * - BpmnParser: BPMN解析器
 * - createWorkflowEngine: 创建工作流引擎（Express中间件）
 */

export { FlowManager, WorkflowNode } from './manager/FlowManager';
export { WorkerManager, PendingTask } from './engine/WorkerManager';
export { EngineRunner } from './engine/EngineRunner';
export { bpmnParser, BpmnParser } from './utils/BpmnParser';

// 重新导出类型
export type { 
  WorkflowResponse, 
  WorkflowData 
} from './types';

export { ProcessStatus, TaskStatus } from './types';

export type {
  BizApproval,
  BizApprovalHistory,
  BizFlowDesign,
  RuTask,
  RuExecution,
  RuVariable
} from './db/entities';

// 工作流引擎选项
export interface WorkflowEngineOptions {
  /** 数据库配置 */
  dbConfig: {
    /** 数据库类型: mssql, postgres, mysql, sqlite */
    type: 'mssql' | 'postgres' | 'mysql' | 'sqlite';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database: string;
    synchronize?: boolean;
    logging?: boolean;
    ssl?: boolean;
  };
  
  /** Zeebe配置 */
  zeebe?: {
    /** Zeebe网关地址 */
    gatewayAddress?: string;
    /** 长轮询间隔 */
    longPoll?: number;
    /** 轮询间隔 */
    pollInterval?: number;
  };
  
  /** API配置 */
  api?: {
    /** API路由前缀 */
    prefix?: string;
    /** 是否启用内置API */
    enabled?: boolean;
  };
  
  /** 日志配置 */
  logger?: {
    info?: (msg: string, ...args: any[]) => void;
    error?: (msg: string, ...args: any[]) => void;
    debug?: (msg: string, ...args: any[]) => void;
  };
  
  /** 回调函数 */
  callbacks?: {
    /** 任务创建回调 */
    onTaskCreated?: (task: any) => void | Promise<void>;
    /** 任务完成回调 */
    onTaskCompleted?: (task: any, result: any) => void | Promise<void>;
    /** 流程启动回调 */
    onProcessStarted?: (process: any) => void | Promise<void>;
    /** 流程完成回调 */
    onProcessCompleted?: (process: any) => void | Promise<void>;
  };
}

/**
 * 创建工作流引擎
 * @param options 配置选项
 * @returns 包含流程管理器和事件发射器的对象
 */
export function createWorkflowEngine(options: WorkflowEngineOptions) {
  // 这里可以根据配置创建不同的实现
  // 目前返回核心类的实例
  throw new Error('createWorkflowEngine is not implemented yet. Use individual classes instead.');
}

import { DataSource } from 'typeorm';

/**
 * 创建数据库数据源
 * @param config 数据库配置
 * @returns TypeORM DataSource
 */
export function createDataSource(config: WorkflowEngineOptions['dbConfig']): DataSource {
  const { type, host, port, username, password, database, synchronize = false, logging = false } = config;
  
  switch (type) {
    case 'mssql':
      return new DataSource({
        type: 'mssql',
        host,
        port: port || 1433,
        username,
        password,
        database,
        synchronize,
        logging,
        options: { trustServerCertificate: true, encrypt: false },
        entities: [__dirname + '/db/entities/*.js']
      });
      
    case 'postgres':
      return new DataSource({
        type: 'postgres',
        host,
        port: port || 5432,
        username,
        password,
        database,
        synchronize,
        logging,
        entities: [__dirname + '/db/entities/*.js']
      });
      
    case 'mysql':
      return new DataSource({
        type: 'mysql',
        host,
        port: port || 3306,
        username,
        password,
        database,
        synchronize,
        logging,
        entities: [__dirname + '/db/entities/*.js']
      });
      
    case 'sqlite':
      return new DataSource({
        type: 'better-sqlite3',
        database,
        synchronize,
        logging,
        entities: [__dirname + '/db/entities/*.js']
      });
      
    default:
      throw new Error(`Unsupported database type: ${type}`);
  }
}
