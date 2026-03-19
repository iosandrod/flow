import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_RU_ACTINST')
export class RuActinst {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'REV_', type: 'int' })
    REV_!: number;
    @Column({ name: 'PROC_DEF_ID_', type: 'varchar', length: 64 })
    PROC_DEF_ID_!: string;
    @Column({ name: 'PROC_INST_ID_', type: 'varchar', length: 64 })
    PROC_INST_ID_!: string;
    @Column({ name: 'EXECUTION_ID_', type: 'varchar', length: 64 })
    EXECUTION_ID_!: string;
    @Column({ name: 'ACTIVITY_ID_', type: 'varchar', length: 64 })
    ACTIVITY_ID_!: string;
    @Column({ name: 'ACTIVITY_NAME_', type: 'varchar', length: 255 })
    ACTIVITY_NAME_!: string;
    @Column({ name: 'ACTIVITY_TYPE_', type: 'varchar', length: 100 })
    ACTIVITY_TYPE_!: string;
    @Column({ name: 'START_TIME_', type: 'datetime' })
    START_TIME_!: string;
    @Column({ name: 'END_TIME_', type: 'datetime' })
    END_TIME_!: string;
    @Column({ name: 'DURATION_', type: 'bigint' })
    DURATION_!: number;
    @Column({ name: 'TENANT_ID_', type: 'varchar', length: 64 })
    TENANT_ID_!: string;
}
