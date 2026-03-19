import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_HI_COMMENT')
export class HiComment {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'TYPE_', type: 'varchar', length: 50 })
    TYPE_!: string;
    @Column({ name: 'USER_ID_', type: 'varchar', length: 64 })
    USER_ID_!: string;
    @Column({ name: 'TASK_ID_', type: 'varchar', length: 64 })
    TASK_ID_!: string;
    @Column({ name: 'PROC_INST_ID_', type: 'varchar', length: 64 })
    PROC_INST_ID_!: string;
    @Column({ name: 'ACTION_', type: 'varchar', length: 64 })
    ACTION_!: string;
    @Column({ name: 'MESSAGE_', type: 'varchar', length: 1000 })
    MESSAGE_!: string;
    @Column({ name: 'FULL_MSG_', type: 'text' })
    FULL_MSG_!: string;
    @CreateDateColumn({ name: 'CREATE_TIME_', type: 'datetime' })
    CREATE_TIME_!: string;
}
