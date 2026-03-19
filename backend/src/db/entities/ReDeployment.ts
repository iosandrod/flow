import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_RE_DEPLOYMENT')
export class ReDeployment {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'NAME_', type: 'varchar', length: 255 })
    NAME_!: string;
    @Column({ name: 'CATEGORY_', type: 'varchar', length: 255 })
    CATEGORY_!: string;
    @Column({ name: 'KEY_', type: 'varchar', length: 255 })
    KEY_!: string;
    @Column({ name: 'TENANT_ID_', type: 'varchar', length: 64 })
    TENANT_ID_!: string;
    @Column({ name: 'DEPLOY_TIME_', type: 'datetime' })
    DEPLOY_TIME_!: string;
    @Column({ name: 'DURATION_', type: 'bigint' })
    DURATION_!: number;
    @Column({ name: 'PARENT_DEPLOYMENT_ID_', type: 'varchar', length: 64 })
    PARENT_DEPLOYMENT_ID_!: string;
}
