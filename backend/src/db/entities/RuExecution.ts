import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_RU_EXECUTION')
export class RuExecution {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'REV_', type: 'int' })
    REV_!: number;
    @Column({ name: 'ROOT_PROC_INST_ID_', type: 'varchar', length: 64 })
    ROOT_PROC_INST_ID_!: string;
    @Column({ name: 'PROC_INST_ID_', type: 'varchar', length: 64, nullable: true })
    PROC_INST_ID_!: string;
    @Column({ name: 'BUSINESS_KEY_', type: 'varchar', length: 255 })
    BUSINESS_KEY_!: string;
    @Column({ name: 'PARENT_ID_', type: 'varchar', length: 64 })
    PARENT_ID_!: string;
    @Column({ name: 'SUPER_EXECUTION_', type: 'varchar', length: 64 })
    SUPER_EXECUTION_!: string;
    @Column({ name: 'SUPER_PROCESS_INSTANCE_ID_', type: 'varchar', length: 64 })
    SUPER_PROCESS_INSTANCE_ID_!: string;
    @Column({ name: 'EXECUTION_ID_', type: 'varchar', length: 64 })
    EXECUTION_ID_!: string;
    @Column({ name: 'PROCESS_DEF_ID_', type: 'varchar', length: 64 })
    PROCESS_DEF_ID_!: string;
    @Column({ name: 'PROCESS_DEF_KEY_', type: 'varchar', length: 128 })
    PROCESS_DEF_KEY_!: string;
    @Column({ name: 'ACTIVITY_ID_', type: 'varchar', length: 64 })
    ACTIVITY_ID_!: string;
    @Column({ name: 'START_ACTIVITY_ID_', type: 'varchar', length: 64 })
    START_ACTIVITY_ID_!: string;
    @Column({ name: 'START_TIME_', type: 'datetime' })
    START_TIME_!: string;
    @Column({ name: 'END_TIME_', type: 'datetime' })
    END_TIME_!: string;
    @Column({ name: 'DURATION_', type: 'bigint' })
    DURATION_!: number;
    @Column({ name: 'STATE_', type: 'varchar', length: 32 })
    STATE_!: string;
    @Column({ name: 'END_ACTIVITY_ID_', type: 'varchar', length: 64 })
    END_ACTIVITY_ID_!: string;
    @Column({ name: 'TENANT_ID_', type: 'varchar', length: 64 })
    TENANT_ID_!: string;
    @Column({ name: 'PRIORITY_', type: 'int' })
    PRIORITY_!: number;
}
