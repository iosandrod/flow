import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_RU_VARIABLE')
export class RuVariable {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'REV_', type: 'int' })
    REV_!: number;
    @Column({ name: 'TYPE_', type: 'varchar', length: 64 })
    TYPE_!: string;
    @Column({ name: 'NAME_', type: 'varchar', length: 128 })
    NAME_!: string;
    @Column({ name: 'EXECUTION_ID_', type: 'varchar', length: 64 })
    EXECUTION_ID_!: string;
    @Column({ name: 'PROC_INST_ID_', type: 'varchar', length: 64 })
    PROC_INST_ID_!: string;
    @Column({ name: 'TASK_ID_', type: 'varchar', length: 64 })
    TASK_ID_!: string;
    @Column({ name: 'SCOPE_ID_', type: 'varchar', length: 64 })
    SCOPE_ID_!: string;
    @Column({ name: 'SUB_SCOPE_ID_', type: 'varchar', length: 64 })
    SUB_SCOPE_ID_!: string;
    @Column({ name: 'ROOT_SCOPE_ID_', type: 'varchar', length: 64 })
    ROOT_SCOPE_ID_!: string;
    @Column({ name: 'VALUE_', type: 'text' })
    VALUE_!: string;
    @Column({ name: 'VALUE_ID_', type: 'varchar', length: 64 })
    VALUE_ID_!: string;
    @CreateDateColumn({ name: 'CREATE_TIME_', type: 'datetime' })
    CREATE_TIME_!: string;
    @Column({ name: 'TENANT_ID_', type: 'varchar', length: 64 })
    TENANT_ID_!: string;
}
