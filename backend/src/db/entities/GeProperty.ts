import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ACT_GE_PROPERTY')
export class GeProperty {
    @PrimaryColumn({ name: 'NAME_', length: 64 })
    NAME_!: string;
    @Column({ name: 'VALUE_', type: 'varchar', length: 300 })
    VALUE_!: string;
    @Column({ name: 'REV_', type: 'int' })
    REV_!: number;
}
