import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_RE_MODEL')
export class ReModel {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'REV_', type: 'int' })
    REV_!: number;
    @Column({ name: 'NAME_', type: 'varchar', length: 255 })
    NAME_!: string;
    @Column({ name: 'KEY_', type: 'varchar', length: 255 })
    KEY_!: string;
    @Column({ name: 'CATEGORY_', type: 'varchar', length: 255 })
    CATEGORY_!: string;
    @Column({ name: 'VERSION_', type: 'int' })
    VERSION_!: number;
    @Column({ name: 'DEPLOYMENT_ID_', type: 'varchar', length: 64 })
    DEPLOYMENT_ID_!: string;
    @Column({ name: 'DEPLOY_TIME_', type: 'datetime' })
    DEPLOY_TIME_!: string;
    @Column({ name: 'MODEL_DEPLOYMENT_ID_', type: 'varchar', length: 64 })
    MODEL_DEPLOYMENT_ID_!: string;
    @Column({ name: 'EDITOR_SOURCE_VALUE_ID_', type: 'varchar', length: 64 })
    EDITOR_SOURCE_VALUE_ID_!: string;
    @Column({ name: 'EDITOR_SOURCE_EXTRA_VALUE_ID_', type: 'varchar', length: 64 })
    EDITOR_SOURCE_EXTRA_VALUE_ID_!: string;
    @Column({ name: 'TENANT_ID_', type: 'varchar', length: 64 })
    TENANT_ID_!: string;
}
