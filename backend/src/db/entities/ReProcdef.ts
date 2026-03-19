import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_RE_PROCDEF')
export class ReProcdef {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'REV_', type: 'int' })
    REV_!: number;
    @Column({ name: 'CATEGORY_', type: 'varchar', length: 255 })
    CATEGORY_!: string;
    @Column({ name: 'NAME_', type: 'varchar', length: 255 })
    NAME_!: string;
    @Column({ name: 'KEY_', type: 'varchar', length: 255, nullable: true })
    KEY_!: string;
    @Column({ name: 'VERSION_', type: 'int', nullable: true })
    VERSION_!: number;
    @Column({ name: 'DEPLOYMENT_ID_', type: 'varchar', length: 64 })
    DEPLOYMENT_ID_!: string;
    @Column({ name: 'RESOURCE_NAME_', type: 'varchar', length: 500 })
    RESOURCE_NAME_!: string;
    @Column({ name: 'DGRM_RESOURCE_NAME_', type: 'varchar', length: 500 })
    DGRM_RESOURCE_NAME_!: string;
    @Column({ name: 'DESCRIPTION_', type: 'varchar', length: 1000 })
    DESCRIPTION_!: string;
    @Column({ name: 'HAS_START_FORM_KEY_', type: 'boolean' })
    HAS_START_FORM_KEY_!: boolean;
    @Column({ name: 'HAS_END_EVENT_', type: 'boolean' })
    HAS_END_EVENT_!: boolean;
    @Column({ name: 'SUSPENSION_STATE_', type: 'int' })
    SUSPENSION_STATE_!: number;
    @Column({ name: 'TENANT_ID_', type: 'varchar', length: 64 })
    TENANT_ID_!: string;
    @Column({ name: 'VERSION_TAG_', type: 'varchar', length: 64 })
    VERSION_TAG_!: string;
    @Column({ name: 'HISTORY_LEVEL_', type: 'int' })
    HISTORY_LEVEL_!: number;
    @Column({ name: 'STARTABLE_', type: 'boolean' })
    STARTABLE_!: boolean;
}
