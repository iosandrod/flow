import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_RU_EVENT_SUBSCR')
export class RuEventSubscr {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'REV_', type: 'int' })
    REV_!: number;
    @Column({ name: 'EVENT_TYPE_', type: 'varchar', length: 64 })
    EVENT_TYPE_!: string;
    @Column({ name: 'EVENT_NAME_', type: 'varchar', length: 255 })
    EVENT_NAME_!: string;
    @Column({ name: 'EXECUTION_ID_', type: 'varchar', length: 64 })
    EXECUTION_ID_!: string;
    @Column({ name: 'PROC_INST_ID_', type: 'varchar', length: 64 })
    PROC_INST_ID_!: string;
    @Column({ name: 'ACTIVITY_ID_', type: 'varchar', length: 64 })
    ACTIVITY_ID_!: string;
    @Column({ name: 'CONFIGURATION_', type: 'varchar', length: 255 })
    CONFIGURATION_!: string;
    @Column({ name: 'CREATED_', type: 'datetime' })
    CREATED_!: string;
    @Column({ name: 'PROC_DEF_ID_', type: 'varchar', length: 64 })
    PROC_DEF_ID_!: string;
    @Column({ name: 'TENANT_ID_', type: 'varchar', length: 64 })
    TENANT_ID_!: string;
}
