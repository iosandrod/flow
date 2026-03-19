import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_RE_NODE_CONFIG')
export class ReNodeConfig {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'PROC_DEF_KEY_', type: 'varchar', length: 128, nullable: true })
    PROC_DEF_KEY_!: string;
    @Column({ name: 'NODE_ID_', type: 'varchar', length: 128, nullable: true })
    NODE_ID_!: string;
    @Column({ name: 'NODE_NAME_', type: 'varchar', length: 255 })
    NODE_NAME_!: string;
    @Column({ name: 'APPROVER_TYPE_', type: 'varchar', length: 32 })
    APPROVER_TYPE_!: string;
    @Column({ name: 'APPROVER_VALUE_', type: 'varchar', length: 255 })
    APPROVER_VALUE_!: string;
    @Column({ name: 'MULTIPLE_', type: 'boolean' })
    MULTIPLE_!: boolean;
    @Column({ name: 'SEQUENTIAL_', type: 'boolean' })
    SEQUENTIAL_!: boolean;
    @Column({ name: 'CONDITION_EXPRESSION_', type: 'varchar', length: 1000 })
    CONDITION_EXPRESSION_!: string;
    @Column({ name: 'FORM_KEY_', type: 'varchar', length: 255 })
    FORM_KEY_!: string;
    @CreateDateColumn({ name: 'CREATE_TIME_', type: 'datetime' })
    CREATE_TIME_!: string;
}
