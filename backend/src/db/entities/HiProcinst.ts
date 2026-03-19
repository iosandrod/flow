import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_HI_PROCINST')
export class HiProcinst {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'PROC_INST_ID_', type: 'varchar', length: 64, nullable: true })
    PROC_INST_ID_!: string;
    @Column({ name: 'BUSINESS_KEY_', type: 'varchar', length: 255 })
    BUSINESS_KEY_!: string;
    @Column({ name: 'PROC_DEF_ID_', type: 'varchar', length: 64 })
    PROC_DEF_ID_!: string;
    @Column({ name: 'PROC_DEF_KEY_', type: 'varchar', length: 128 })
    PROC_DEF_KEY_!: string;
    @Column({ name: 'START_TIME_', type: 'datetime', nullable: true })
    START_TIME_!: string;
    @Column({ name: 'END_TIME_', type: 'datetime' })
    END_TIME_!: string;
    @Column({ name: 'DURATION_', type: 'bigint' })
    DURATION_!: number;
    @Column({ name: 'START_USER_ID_', type: 'varchar', length: 64 })
    START_USER_ID_!: string;
    @Column({ name: 'START_ACT_ID_', type: 'varchar', length: 64 })
    START_ACT_ID_!: string;
    @Column({ name: 'END_ACT_ID_', type: 'varchar', length: 64 })
    END_ACT_ID_!: string;
    @Column({ name: 'SUPER_PROCESS_INSTANCE_ID_', type: 'varchar', length: 64 })
    SUPER_PROCESS_INSTANCE_ID_!: string;
    @Column({ name: 'ROOT_PROC_INST_ID_', type: 'varchar', length: 64 })
    ROOT_PROC_INST_ID_!: string;
    @Column({ name: 'TENANT_ID_', type: 'varchar', length: 64 })
    TENANT_ID_!: string;
    @Column({ name: 'NAME_', type: 'varchar', length: 255 })
    NAME_!: string;
    @Column({ name: 'CALLBACK_ID_', type: 'varchar', length: 64 })
    CALLBACK_ID_!: string;
    @Column({ name: 'CALLBACK_TYPE_', type: 'varchar', length: 64 })
    CALLBACK_TYPE_!: string;
    @Column({ name: 'STATE_', type: 'varchar', length: 32 })
    STATE_!: string;
}
