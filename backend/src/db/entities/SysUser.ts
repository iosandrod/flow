import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('Sys_User')
export class SysUser {
    @PrimaryColumn({ name: 'User_Id', length: 50 })
    User_Id!: string;
    @Column({ name: 'UserName', length: 100, nullable: true })
    UserName!: string;
    @Column({ name: 'UserPwd', length: 100, nullable: true })
    UserPwd!: string;
    @Column({ name: 'UserTrueName', length: 100, nullable: true })
    UserTrueName!: string;
    @Column({ name: 'Role_Id', nullable: true })
    Role_Id!: number;
    @Column({ name: 'RoleName', length: 100, nullable: true })
    RoleName!: string;
    @Column({ name: 'Dept_Id', nullable: true })
    Dept_Id!: number;
    @Column({ name: 'DeptName', length: 100, nullable: true })
    DeptName!: string;
    @Column({ name: 'Gender', length: 10, nullable: true })
    Gender!: string;
    @Column({ name: 'Mobile', length: 20, nullable: true })
    Mobile!: string;
    @Column({ name: 'PhoneNo', length: 20, nullable: true })
    PhoneNo!: string;
    @Column({ name: 'Tel', length: 20, nullable: true })
    Tel!: string;
    @Column({ name: 'Email', length: 100, nullable: true })
    Email!: string;
    @Column({ name: 'Address', length: 255, nullable: true })
    Address!: string;
    @Column({ name: 'Remark', length: 500, nullable: true })
    Remark!: string;
    @Column({ name: 'HeadImageUrl', length: 255, nullable: true })
    HeadImageUrl!: string;
    @Column({ name: 'Enable', nullable: true })
    Enable!: number;
    @Column({ name: 'IsRegregisterPhone', nullable: true })
    IsRegregisterPhone!: number;
    @Column({ name: 'CreateDate', type: 'datetime', nullable: true })
    CreateDate!: string;
    @Column({ name: 'CreateID', nullable: true })
    CreateID!: number;
    @Column({ name: 'ModifyDate', type: 'datetime', nullable: true })
    ModifyDate!: string;
    @Column({ name: 'ModifyID', nullable: true })
    ModifyID!: number;
    @Column({ name: 'AuditStatus', length: 20, nullable: true })
    AuditStatus!: string;
    @Column({ name: 'AuditDate', type: 'datetime', nullable: true })
    AuditDate!: string;
    @Column({ name: 'Auditor', length: 100, nullable: true })
    Auditor!: string;
    @Column({ name: 'Creator', length: 100, nullable: true })
    Creator!: string;
    @Column({ name: 'Modifier', length: 100, nullable: true })
    Modifier!: string;
    @Column({ name: 'LastLoginDate', type: 'datetime', nullable: true })
    LastLoginDate!: string;
    @Column({ name: 'LastModifyPwdDate', type: 'datetime', nullable: true })
    LastModifyPwdDate!: string;
    @Column({ name: 'OrderNo', nullable: true })
    OrderNo!: number;
    @Column({ name: 'Token', length: 500, nullable: true })
    Token!: string;
    @Column({ name: 'cPsn_Num', length: 50, nullable: true })
    cPsn_Num!: string;
    @Column({ name: 'cRoleNote', length: 500, nullable: true })
    cRoleNote!: string;
    @Column({ name: 'dEffectiveDate', type: 'datetime', nullable: true })
    dEffectiveDate!: string;
    @Column({ name: 'dDisableDate', type: 'datetime', nullable: true })
    dDisableDate!: string;
    @Column({ name: 'iErpUserID', nullable: true })
    iErpUserID!: number;
}
