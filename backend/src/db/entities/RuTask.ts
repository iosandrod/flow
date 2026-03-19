import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('ACT_RU_TASK')
export class RuTask {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'REV_', type: 'int', nullable: true })
    REV_!: number;
    @Column({ name: 'EXECUTION_ID_', type: 'varchar', length: 64, nullable: true })
    EXECUTION_ID_!: string;
    @Column({ name: 'PROC_INST_ID_', type: 'varchar', length: 64, nullable: true })
    PROC_INST_ID_!: string;
    @Column({ name: 'PROC_DEF_ID_', type: 'varchar', length: 64, nullable: true })
    PROC_DEF_ID_!: string;
    @Column({ name: 'PROC_DEF_KEY_', type: 'varchar', length: 128, nullable: true })
    PROC_DEF_KEY_!: string;
    @Column({ name: 'TASK_DEF_ID_', type: 'varchar', length: 64, nullable: true })
    TASK_DEF_ID_!: string;
    @Column({ name: 'TASK_DEF_KEY_', type: 'varchar', length: 128, nullable: true })
    TASK_DEF_KEY_!: string;
    @Column({ name: 'NAME_', type: 'varchar', length: 128, nullable: true })
    NAME_!: string;
    @Column({ name: 'PARENT_TASK_ID_', type: 'varchar', length: 64, nullable: true })
    PARENT_TASK_ID_!: string;
    @Column({ name: 'DESCRIPTION_', type: 'varchar', length: 1000, nullable: true })
    DESCRIPTION_!: string;
    @Column({ name: 'OWNER_', type: 'varchar', length: 64, nullable: true })
    OWNER_!: string;
    @Column({ name: 'ASSIGNEE_', type: 'varchar', length: 64, nullable: true })
    ASSIGNEE_!: string;
    @Column({ name: 'START_TIME_', type: 'datetime', nullable: true })
    START_TIME_!: string;
    @Column({ name: 'END_TIME_', type: 'datetime', nullable: true })
    END_TIME_!: string;
    @Column({ name: 'DURATION_', type: 'bigint', nullable: true })
    DURATION_!: number;
    @Column({ name: 'PRIORITY_', type: 'int', nullable: true })
    PRIORITY_!: number;
    @Column({ name: 'DUE_DATE_', type: 'datetime', nullable: true })
    DUE_DATE_!: string;
    @Column({ name: 'CATEGORY_', type: 'varchar', length: 2000, nullable: true })
    CATEGORY_!: string;
    @Column({ name: 'SUSPENSION_STATE_', type: 'int', nullable: true })
    SUSPENSION_STATE_!: number;
    @Column({ name: 'TENANT_ID_', type: 'varchar', length: 64, nullable: true })
    TENANT_ID_!: string;
    @Column({ name: 'FORM_KEY_', type: 'varchar', length: 255, nullable: true })
    FORM_KEY_!: string;
    @Column({ name: 'TASK_KEY_', type: 'varchar', length: 64, nullable: true })
    TASK_KEY_!: string;
    @Column({ name: 'APPROVAL_ID_', type: 'varchar', length: 64, nullable: true })
    APPROVAL_ID_!: string;
    @Column({ name: 'APPROVAL_USER_', type: 'varchar', length: 64, nullable: true })
    APPROVAL_USER_!: string;
    @Column({ name: 'CUSTOM_HEADERS_', type: 'varchar', length: 2000, nullable: true })
    CUSTOM_HEADERS_!: string;
    
    getCustomHeaders(): Record<string, string> | null {
        if (!this.CUSTOM_HEADERS_) return null;
        try {
            return JSON.parse(this.CUSTOM_HEADERS_);
        } catch {
            return null;
        }
    }
    
    getApprovalId(): string | null {
        return this.APPROVAL_ID_ || null;
    }
}
