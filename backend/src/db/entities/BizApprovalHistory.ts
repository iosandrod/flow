import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('ACT_BIZ_APPROVAL_HISTORY')
export class BizApprovalHistory {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'APPROVAL_ID_', type: 'nvarchar', length: 64, nullable: true })
    APPROVAL_ID_!: string;
    @Column({ name: 'PROC_INST_ID_', type: 'nvarchar', length: 64, nullable: true })
    PROC_INST_ID_!: string;
    @Column({ name: 'TASK_ID_', type: 'nvarchar', length: 64, nullable: true })
    TASK_ID_!: string;
    @Column({ name: 'TASK_NAME_', type: 'nvarchar', length: 128, nullable: true })
    TASK_NAME_!: string;
    @Column({ name: 'TASK_DEF_KEY_', type: 'nvarchar', length: 128, nullable: true })
    TASK_DEF_KEY_!: string;
    @Column({ name: 'ASSIGNEE_', type: 'nvarchar', length: 64, nullable: true })
    ASSIGNEE_!: string;
    @Column({ name: 'ASSIGNEE_NAME_', type: 'nvarchar', length: 128, nullable: true })
    ASSIGNEE_NAME_!: string;
    @Column({ name: 'ACTION_', type: 'nvarchar', length: 32, nullable: true })
    ACTION_!: string;
    @Column({ name: 'COMMENT_', type: 'nvarchar', length: 1000, nullable: true })
    COMMENT_!: string;
    @Column({ name: 'CREATE_TIME_', type: 'datetime', nullable: true })
    CREATE_TIME_!: string;
}
