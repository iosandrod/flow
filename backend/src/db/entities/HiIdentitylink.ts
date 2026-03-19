import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_HI_IDENTITYLINK')
export class HiIdentitylink {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'GROUP_ID_', type: 'varchar', length: 64 })
    GROUP_ID_!: string;
    @Column({ name: 'TYPE_', type: 'varchar', length: 64 })
    TYPE_!: string;
    @Column({ name: 'USER_ID_', type: 'varchar', length: 64 })
    USER_ID_!: string;
    @Column({ name: 'TASK_ID_', type: 'varchar', length: 64 })
    TASK_ID_!: string;
    @Column({ name: 'PROC_INST_ID_', type: 'varchar', length: 64 })
    PROC_INST_ID_!: string;
    @Column({ name: 'PROC_DEF_ID_', type: 'varchar', length: 64 })
    PROC_DEF_ID_!: string;
    @CreateDateColumn({ name: 'CREATE_TIME_', type: 'datetime' })
    CREATE_TIME_!: string;
}
