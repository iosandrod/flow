import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_GE_BYTEARRAY')
export class GeBytearray {
    @PrimaryColumn({ name: 'ID_', length: 64 })
    ID_!: string;
    @Column({ name: 'REV_', type: 'int' })
    REV_!: number;
    @Column({ name: 'NAME_', type: 'varchar', length: 255 })
    NAME_!: string;
    @Column({ name: 'DEPLOYMENT_ID_', type: 'varchar', length: 64 })
    DEPLOYMENT_ID_!: string;
    @Column({ name: 'BYTES_', type: 'blob' })
    BYTES_!: string;
    @Column({ name: 'GENERATED_', type: 'boolean' })
    GENERATED_!: boolean;
}
