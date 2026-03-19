import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('ACT_BIZ_APPROVAL')
export class BizApproval {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'TITLE_', type: 'nvarchar', length: 255, nullable: true })
    TITLE_!: string;
    @Column({ name: 'AMOUNT_', type: 'decimal', precision: 15, scale: 2, nullable: true })
    AMOUNT_!: number;
    @Column({ name: 'APPLICANT_', type: 'nvarchar', length: 64, nullable: true })
    APPLICANT_!: string;
    @Column({ name: 'APPLICANT_NAME_', type: 'nvarchar', length: 128, nullable: true })
    APPLICANT_NAME_!: string;
    @Column({ name: 'BUSINESS_TYPE_', type: 'nvarchar', length: 64, nullable: true })
    BUSINESS_TYPE_!: string;
    @Column({ name: 'DESCRIPTION_', type: 'nvarchar', length: 1000, nullable: true })
    DESCRIPTION_!: string;
    @Column({ name: 'STATUS_', type: 'nvarchar', length: 32, nullable: true })
    STATUS_!: string;
    @Column({ name: 'PROC_INST_ID_', type: 'nvarchar', length: 64, nullable: true })
    PROC_INST_ID_!: string;
    @Column({ name: 'CURRENT_NODE_', type: 'nvarchar', length: 128, nullable: true })
    CURRENT_NODE_!: string;
    @Column({ name: 'CURRENT_ASSIGNEE_', type: 'nvarchar', length: 64, nullable: true })
    CURRENT_ASSIGNEE_!: string;
    @Column({ name: 'FORM_DATA_', type: 'nvarchar', length: 'max', nullable: true })
    FORM_DATA_!: string;
    @Column({ name: 'CREATE_TIME_', type: 'datetime', nullable: true })
    CREATE_TIME_!: string;
    @Column({ name: 'UPDATE_TIME_', type: 'datetime', nullable: true })
    UPDATE_TIME_!: string;
}
