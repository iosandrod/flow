import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_BIZ_APPROVAL_HISTORY')
export class BizApprovalHistory {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'APPROVAL_ID_', type: 'nvarchar', length: 64 })
    APPROVAL_ID_!: string;
    @Column({ name: 'PROC_INST_ID_', type: 'nvarchar', length: 64 })
    PROC_INST_ID_!: string;
    @Column({ name: 'TASK_ID_', type: 'nvarchar', length: 64 })
    TASK_ID_!: string;
    @Column({ name: 'TASK_NAME_', type: 'nvarchar', length: 128 })
    TASK_NAME_!: string;
    @Column({ name: 'TASK_DEF_KEY_', type: 'nvarchar', length: 128 })
    TASK_DEF_KEY_!: string;
    @Column({ name: 'ASSIGNEE_', type: 'nvarchar', length: 64 })
    ASSIGNEE_!: string;
    @Column({ name: 'ASSIGNEE_NAME_', type: 'nvarchar', length: 128 })
    ASSIGNEE_NAME_!: string;
    @Column({ name: 'ACTION_', type: 'nvarchar', length: 32 })
    ACTION_!: string;
    @Column({ name: 'COMMENT_', type: 'nvarchar', length: 1000 })
    COMMENT_!: string;
    @CreateDateColumn({ name: 'CREATE_TIME_', type: 'datetime' })
    CREATE_TIME_!: string;
}
