import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity()
export class BackupStorage {
    @PrimaryColumn({ type: 'int' })
    id: number;

    @PrimaryColumn({ type: 'int' })
    corporateId: number;

    @Column({ type: 'varchar', length: 300, nullable: true })
    url: string;
}