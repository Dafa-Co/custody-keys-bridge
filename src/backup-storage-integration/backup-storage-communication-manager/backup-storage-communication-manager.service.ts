import { InjectRepository } from "@nestjs/typeorm";
import { BackupStorageVerifyKey } from "../entities/backup-storage-verify-key.entity";
import { EntityManager, Repository } from "typeorm";
import { BackupStorageActiveSession } from "../entities/backup-storage-active-session.entity";
import { v4 as uuidv4 } from 'uuid';
import { REVOKE_VERIFY_KEY_AFTER } from "../constants/backup-storage.constants";
import { BackupStorageHandshakingDto } from "rox-custody_common-modules/libs/dtos/backup-storage-handshaking.dto";
import { bridgeHandshakingResponseDto } from "rox-custody_common-modules/libs/dtos/bridge-handshaking-response.dto";
import { ForbiddenException } from "@nestjs/common";
import { SecureCommunicationService } from "rox-custody_common-modules/libs/services/secure-communication/secure-communication.service";
import { BackupStorage } from "../entities/backup-storage.entity";

export class BackupStorageCommunicationManagerService {
    constructor(
        @InjectRepository(BackupStorageVerifyKey)
        private backupStorageVerifyKeyRepository: Repository<BackupStorageVerifyKey>,
        @InjectRepository(BackupStorageActiveSession)
        private backupStorageActiveSessionRepository: Repository<BackupStorageActiveSession>,
        @InjectRepository(BackupStorage)
        private backupStorageRepository: Repository<BackupStorage>,
    ) { }

    generateVerifyKey(): string {
        return uuidv4().replace(/-/g, '').substring(0, 32);
    }

    private async rotateVerifyKeys(corporateId: number, backupStorageId: number) {
        const queryForRevoke = this.backupStorageVerifyKeyRepository
            .createQueryBuilder('verify_keys_to_keep')
            .select('verify_keys_to_keep.verifyKey as verifyKey')
            .where('verify_keys_to_keep.corporateId = :corporateId', { corporateId })
            .andWhere('verify_keys_to_keep.backupStorageId = :backupStorageId', { backupStorageId })
            .orderBy('verify_keys_to_keep.created_at', 'DESC')
            .limit(REVOKE_VERIFY_KEY_AFTER);

        await this.backupStorageVerifyKeyRepository
            .createQueryBuilder('backup_storage_verify_key')
            .delete()
            .addCommonTableExpression(queryForRevoke, 'queryForRevoke')
            .where('backup_storage_verify_key.corporateId = :corporateId', { corporateId })
            .andWhere('backup_storage_verify_key.backupStorageId = :backupStorageId', { backupStorageId })
            .andWhere('backup_storage_verify_key.verifyKey NOT IN (SELECT verifyKey FROM queryForRevoke)')
            .execute();
    }

    async saveVerifyKey(
        verifyKey: string,
        corporateId: number,
        backupStorageId: number,
    ): Promise<void> {
        await this.backupStorageVerifyKeyRepository
            .insert({
                verifyKey,
                corporateId,
                backupStorageId,
            });
    }

    async handshakeWithBackupStorage(
        handshakeData: BackupStorageHandshakingDto
    ): Promise<bridgeHandshakingResponseDto> {
        const expirationAfterHour = new Date();
        expirationAfterHour.setHours(expirationAfterHour.getHours() + 1);

        const backupStorage = await this.backupStorageVerifyKeyRepository.findOne({
            where: { verifyKey: handshakeData.verifyKey, corporateId: handshakeData.corporateId },
        });

        if (!backupStorage) {
            throw new ForbiddenException('Invalid verify key');
        }

        const verifyKey = this.generateVerifyKey();
        const sessionKey = SecureCommunicationService.generateSymmetricKey();

        await Promise.all([
            this.saveVerifyKey(verifyKey, handshakeData.corporateId, backupStorage.backupStorageId),
            this.backupStorageActiveSessionRepository.insert({
                sessionKey,
                corporateId: handshakeData.corporateId,
                backupStorageId: backupStorage.backupStorageId,
                expiresAt: expirationAfterHour,
            }),
            this.backupStorageRepository.update(
                { id: backupStorage.backupStorageId },
                { url: handshakeData.serverUrl },
            ),
        ]);

        await this.rotateVerifyKeys(handshakeData.corporateId, backupStorage.backupStorageId);

        return {
            sessionKey,
            sessionExpirationDate: expirationAfterHour,
            id: backupStorage.backupStorageId,
            verifyKey,
            unencryptedFields: { backupStorageId: backupStorage.backupStorageId }
        };
    }
}