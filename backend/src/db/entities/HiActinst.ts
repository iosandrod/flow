import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_HI_ACTINST')
export class HiActinst {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'PROC_DEF_ID_', type: 'varchar', length: 64 })
    PROC_DEF_ID_!: string;
    @Column({ name: 'PROC_INST_ID_', type: 'varchar', length: 64 })
    PROC_INST_ID_!: string;
    @Column({ name: 'EXECUTION_ID_', type: 'varchar', length: 64 })
    EXECUTION_ID_!: string;
    @Column({ name: 'ACT_ID_', type: 'varchar', length: 64 })
    ACT_ID_!: string;
    @Column({ name: 'TASK_ID_', type: 'varchar', length: 64 })
    TASK_ID_!: string;
    @Column({ name: 'ACT_NAME_', type: 'varchar', length: 255 })
    ACT_NAME_!: string;
    @Column({ name: 'ACT_TYPE_', type: 'varchar', length: 100 })
    ACT_TYPE_!: string;
    @Column({ name: 'ASSIGNEE_', type: 'varchar', length: 64 })
    ASSIGNEE_!: string;
    @Column({ name: 'START_TIME_', type: 'datetime', nullable: true })
    START_TIME_!: string;
    @Column({ name: 'END_TIME_', type: 'datetime' })
    END_TIME_!: string;
    @Column({ name: 'DURATION_', type: 'bigint' })
    DURATION_!: number;
    @Column({ name: 'TENANT_ID_', type: 'varchar', length: 64 })
    TENANT_ID_!: string;
}
