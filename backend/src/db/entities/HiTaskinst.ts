import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('ACT_HI_TASKINST')
export class HiTaskinst {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'PROC_DEF_KEY_', type: 'varchar', length: 128, nullable: true })
    PROC_DEF_KEY_!: string;
    @Column({ name: 'PROC_DEF_ID_', type: 'varchar', length: 64, nullable: true })
    PROC_DEF_ID_!: string;
    @Column({ name: 'PROC_INST_ID_', type: 'varchar', length: 64, nullable: true })
    PROC_INST_ID_!: string;
    @Column({ name: 'EXECUTION_ID_', type: 'varchar', length: 64, nullable: true })
    EXECUTION_ID_!: string;
    @Column({ name: 'TASK_DEF_ID_', type: 'varchar', length: 64, nullable: true })
    TASK_DEF_ID_!: string;
    @Column({ name: 'TASK_DEF_KEY_', type: 'varchar', length: 128, nullable: true })
    TASK_DEF_KEY_!: string;
    @Column({ name: 'NAME_', type: 'varchar', length: 128, nullable: true })
    NAME_!: string;
    @Column({ name: 'PARENT_TASK_ID_', type: 'varchar', length: 64, nullable: true })
    PARENT_TASK_ID_!: string;
    @Column({ name: 'DESCRIPTION_', type: 'varchar', length: 1000, nullable: true })
    DESCRIPTION_!: string;
    @Column({ name: 'OWNER_', type: 'varchar', length: 64, nullable: true })
    OWNER_!: string;
    @Column({ name: 'ASSIGNEE_', type: 'varchar', length: 64, nullable: true })
    ASSIGNEE_!: string;
    @Column({ name: 'START_TIME_', type: 'datetime', nullable: true })
    START_TIME_!: string;
    @Column({ name: 'CLAIM_TIME_', type: 'datetime', nullable: true })
    CLAIM_TIME_!: string;
    @Column({ name: 'END_TIME_', type: 'datetime', nullable: true })
    END_TIME_!: string;
    @Column({ name: 'DURATION_', type: 'bigint', nullable: true })
    DURATION_!: number;
    @Column({ name: 'DELETE_REASON_', type: 'varchar', length: 1000, nullable: true })
    DELETE_REASON_!: string;
    @Column({ name: 'PRIORITY_', type: 'int', nullable: true })
    PRIORITY_!: number;
    @Column({ name: 'DUE_DATE_', type: 'datetime', nullable: true })
    DUE_DATE_!: string;
    @Column({ name: 'FORM_KEY_', type: 'varchar', length: 255, nullable: true })
    FORM_KEY_!: string;
    @Column({ name: 'CATEGORY_', type: 'varchar', length: 255, nullable: true })
    CATEGORY_!: string;
    @Column({ name: 'TENANT_ID_', type: 'varchar', length: 64, nullable: true })
    TENANT_ID_!: string;
    @Column({ name: 'CREATE_TIME_', type: 'datetime', nullable: true })
    CREATE_TIME_!: string;
}
