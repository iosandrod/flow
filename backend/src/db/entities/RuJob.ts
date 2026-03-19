import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_RU_JOB')
export class RuJob {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'REV_', type: 'int' })
    REV_!: number;
    @Column({ name: 'TYPE_', type: 'varchar', length: 100, nullable: true })
    TYPE_!: string;
    @Column({ name: 'LOCK_EXP_TIME_', type: 'datetime' })
    LOCK_EXP_TIME_!: string;
    @Column({ name: 'LOCK_OWNER_', type: 'varchar', length: 64 })
    LOCK_OWNER_!: string;
    @Column({ name: 'EXCLUSIVE_', type: 'boolean' })
    EXCLUSIVE_!: boolean;
    @Column({ name: 'EXECUTION_ID_', type: 'varchar', length: 64 })
    EXECUTION_ID_!: string;
    @Column({ name: 'PROCESS_INSTANCE_ID_', type: 'varchar', length: 64 })
    PROCESS_INSTANCE_ID_!: string;
    @Column({ name: 'PROCESS_DEF_ID_', type: 'varchar', length: 64 })
    PROCESS_DEF_ID_!: string;
    @Column({ name: 'PROCESS_DEF_KEY_', type: 'varchar', length: 128 })
    PROCESS_DEF_KEY_!: string;
    @Column({ name: 'RETRIES_', type: 'int' })
    RETRIES_!: number;
    @Column({ name: 'REPEAT_', type: 'varchar', length: 255 })
    REPEAT_!: string;
    @Column({ name: 'REPEAT_OFFSET_', type: 'bigint' })
    REPEAT_OFFSET_!: number;
    @Column({ name: 'ENDZ_', type: 'datetime' })
    ENDZ_!: string;
    @Column({ name: 'SUSPENSION_STATE_', type: 'int' })
    SUSPENSION_STATE_!: number;
    @Column({ name: 'TENANT_ID_', type: 'varchar', length: 64 })
    TENANT_ID_!: string;
    @Column({ name: 'PRIORITY_', type: 'int' })
    PRIORITY_!: number;
    @Column({ name: 'CATEGORY_', type: 'varchar', length: 255 })
    CATEGORY_!: string;
    @CreateDateColumn({ name: 'CREATE_TIME_', type: 'datetime' })
    CREATE_TIME_!: string;
}
