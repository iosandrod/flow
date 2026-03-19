import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_ID_GROUP')
export class IdGroup {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'REV_', type: 'int' })
    REV_!: number;
    @Column({ name: 'NAME_', type: 'varchar', length: 128 })
    NAME_!: string;
    @Column({ name: 'TYPE_', type: 'varchar', length: 64 })
    TYPE_!: string;
    @Column({ name: 'PARENT_ID_', type: 'varchar', length: 64 })
    PARENT_ID_!: string;
    @Column({ name: 'TENANT_ID_', type: 'varchar', length: 64 })
    TENANT_ID_!: string;
    @CreateDateColumn({ name: 'CREATE_TIME_', type: 'datetime' })
    CREATE_TIME_!: string;
}
