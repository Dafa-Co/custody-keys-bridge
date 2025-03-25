import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Index('backup_storage_verify_key', ['verifyKey', 'corporateId'], { unique: true })
@Entity()
export class BackupStorage {
    @PrimaryColumn({ type: 'int' })
    id: number;

    @PrimaryColumn({ type: 'int' })
    corporateId: number;

    @Column({ type: 'varchar', length: 300, nullable: true })
    url: string;

    @Column({ 
        type: 'varchar', 
        length: 512,
        nullable: true
    })
    backupStoragePublicKey: string;

    @Column({ type: "varchar", length: 50, select: false })
    verifyKey: string;

    @Column({ type: 'varchar', length: 2048, nullable: true })
    identityVerificationPrivateKey: string;

    @Column({ type: 'timestamp', nullable: true })
    sessionExpirationDate: Date;
}