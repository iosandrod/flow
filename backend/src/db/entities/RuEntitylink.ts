import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_RU_ENTITYLINK')
export class RuEntitylink {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'REV_', type: 'int' })
    REV_!: number;
    @CreateDateColumn({ name: 'CREATE_TIME_', type: 'datetime' })
    CREATE_TIME_!: string;
    @Column({ name: 'LINK_TYPE_', type: 'varchar', length: 64 })
    LINK_TYPE_!: string;
    @Column({ name: 'SCOPE_ID_', type: 'varchar', length: 64 })
    SCOPE_ID_!: string;
    @Column({ name: 'SUB_SCOPE_ID_', type: 'varchar', length: 64 })
    SUB_SCOPE_ID_!: string;
    @Column({ name: 'SCOPE_TYPE_', type: 'varchar', length: 64 })
    SCOPE_TYPE_!: string;
    @Column({ name: 'SCOPE_DEFINITION_ID_', type: 'varchar', length: 64 })
    SCOPE_DEFINITION_ID_!: string;
}
