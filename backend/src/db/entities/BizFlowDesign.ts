import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('ACT_BIZ_FLOW_DESIGN')
export class BizFlowDesign {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'NAME_', type: 'varchar', length: 255, nullable: true })
    NAME_!: string;
    @Column({ name: 'DESCRIPTION_', type: 'varchar', length: 1000, nullable: true })
    DESCRIPTION_!: string;
    @Column({ name: 'BPMN_XML_', type: 'text', nullable: true })
    BPMN_XML_!: string;
    @Column({ name: 'STATUS_', type: 'varchar', length: 32, nullable: true })
    STATUS_!: string;
    @Column({ name: 'VERSION_', type: 'int', nullable: true })
    VERSION_!: number;
    @Column({ name: 'CREATE_USER_', type: 'varchar', length: 64, nullable: true })
    CREATE_USER_!: string;
    @Column({ name: 'CREATE_TIME_', type: 'datetime', nullable: true })
    CREATE_TIME_!: string;
    @Column({ name: 'UPDATE_USER_', type: 'varchar', length: 64, nullable: true })
    UPDATE_USER_!: string;
    @Column({ name: 'UPDATE_TIME_', type: 'datetime', nullable: true })
    UPDATE_TIME_!: string;
}
