import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_HI_VARINST')
export class HiVarinst {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'PROC_DEF_KEY_', type: 'varchar', length: 128 })
    PROC_DEF_KEY_!: string;
    @Column({ name: 'PROC_DEF_ID_', type: 'varchar', length: 64 })
    PROC_DEF_ID_!: string;
    @Column({ name: 'PROC_INST_ID_', type: 'varchar', length: 64 })
    PROC_INST_ID_!: string;
    @Column({ name: 'EXECUTION_ID_', type: 'varchar', length: 64 })
    EXECUTION_ID_!: string;
    @Column({ name: 'TASK_ID_', type: 'varchar', length: 64 })
    TASK_ID_!: string;
    @Column({ name: 'NAME_', type: 'varchar', length: 128 })
    NAME_!: string;
    @Column({ name: 'VAR_TYPE_', type: 'varchar', length: 100 })
    VAR_TYPE_!: string;
    @Column({ name: 'REV_', type: 'int' })
    REV_!: number;
    @Column({ name: 'VALUE_', type: 'text' })
    VALUE_!: string;
    @Column({ name: 'VALUE_ID_', type: 'varchar', length: 64 })
    VALUE_ID_!: string;
    @CreateDateColumn({ name: 'CREATE_TIME_', type: 'datetime' })
    CREATE_TIME_!: string;
    @Column({ name: 'TENANT_ID_', type: 'varchar', length: 64 })
    TENANT_ID_!: string;
    @Column({ name: 'LAST_UPDATED_TIME_', type: 'datetime' })
    LAST_UPDATED_TIME_!: string;
}
