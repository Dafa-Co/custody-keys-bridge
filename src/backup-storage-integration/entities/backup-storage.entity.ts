import { Column, Entity, Index, OneToMany, OneToOne, PrimaryColumn } from "typeorm";
import { BackupStorageActiveSession } from "./backup-storage-active-session.entity";

@Entity()
export class BackupStorage {
    @PrimaryColumn({ type: 'int' })
    id: number;

    @PrimaryColumn({ type: 'int' })
    corporateId: number;

    @Column({ type: 'varchar', length: 300, nullable: true })
    url: string;

    @OneToMany(() => BackupStorageActiveSession, (activeSession) => activeSession.backupStorage)
    activeSessions: BackupStorageActiveSession[];

}