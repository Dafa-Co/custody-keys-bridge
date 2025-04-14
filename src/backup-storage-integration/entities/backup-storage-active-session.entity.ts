import { AbstractEntity } from "rox-custody_common-modules/libs/entities/abstract.entity";
import { Entity, JoinColumn, ManyToOne, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { BackupStorage } from "./backup-storage.entity";

@Index(['corporateId', 'backupStorageId'])
@Entity()
export class BackupStorageActiveSession extends AbstractEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 300 })
    sessionKey: string;

    @Column({ type: 'int' })
    corporateId: number;

    @Column({ type: 'int' })
    backupStorageId: number;

    @Column({ type: 'timestamp', nullable: true })
    expiresAt: Date;

    @ManyToOne(() => BackupStorage, { onDelete: 'CASCADE' })
    @JoinColumn([
        { name: 'backupStorageId', referencedColumnName: 'id' },
        { name: 'corporateId', referencedColumnName: 'corporateId' },
    ])
    backupStorage: BackupStorage;
}