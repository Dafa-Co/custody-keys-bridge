import { AbstractEntity } from "rox-custody_common-modules/libs/entities/abstract.entity";
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { BackupStorage } from "./backup-storage.entity";

@Entity()
export class BackupStorageVerifyKey extends AbstractEntity {
    @PrimaryColumn({ type: 'varchar', length: 300 })
    verifyKey: string;

    @PrimaryColumn({ type: 'int' })
    corporateId: number;

    @Column({ type: 'int' })
    backupStorageId: number;

    @ManyToOne(() => BackupStorage, { onDelete: 'CASCADE' })
    @JoinColumn([
        { name: 'backupStorageId', referencedColumnName: 'id' },
        { name: 'corporateId', referencedColumnName: 'corporateId' },
    ])
    backupStorage: BackupStorage;
}