import { InjectRepository } from "@nestjs/typeorm";
import { BackupStorageVerifyKey } from "../entities/backup-storage-verify-key.entity";
import { EntityManager, Repository } from "typeorm";
import { BackupStorageActiveSession } from "../entities/backup-storage-active-session.entity";
import { v4 as uuidv4 } from 'uuid';
import { BACKUP_STORAGE_EXPIRATION_TIME_IN_MINUTES, MAX_NUMBER_OF_ACTIVE_SESSIONS, REVOKE_VERIFY_KEY_AFTER } from "../constants/backup-storage.constants";
import { BackupStorageHandshakingDto } from "rox-custody_common-modules/libs/dtos/backup-storage-handshaking.dto";
import { bridgeHandshakingResponseDto } from "rox-custody_common-modules/libs/dtos/bridge-handshaking-response.dto";
import { ForbiddenException } from "@nestjs/common";
import { SecureCommunicationService } from "rox-custody_common-modules/libs/services/secure-communication/secure-communication.service";
import { BackupStorage } from "../entities/backup-storage.entity";
import { decryptAES256, encryptAES256 } from "rox-custody_common-modules/libs/utils/encryption";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";

export class BackupStorageCommunicationManagerService {
    constructor(
        @InjectRepository(BackupStorageVerifyKey)
        private backupStorageVerifyKeyRepository: Repository<BackupStorageVerifyKey>,
        @InjectRepository(BackupStorageActiveSession)
        private backupStorageActiveSessionRepository: Repository<BackupStorageActiveSession>,
        @InjectRepository(BackupStorage)
        private backupStorageRepository: Repository<BackupStorage>,
        private readonly httpService: HttpService,
    ) { }

    generateVerifyKey(): string {
        return uuidv4().replace(/-/g, '').substring(0, 32);
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

    async clearVerifyKeysOfBackupStorage(
        corporateId: number,
        backupStorageId: number,
    ): Promise<void> {
        await this.backupStorageVerifyKeyRepository
            .delete({
                corporateId,
                backupStorageId,
            });
    }

    private getKeysToSaveAndNewOne(
        data: Array<{ key: string; createdAt: Date }>,
        newKey: string,
    ): { isNewKey: boolean; keyToReturn: string } {
        if (!data?.length) {
            return { isNewKey: true, keyToReturn: newKey };
        }

        const latestKey = data[0].key;
        const latestKeyCreatedAt = data[0].createdAt;

        // if latest key is less than 5 minutes old, do not save new key and return latest key 
        if (new Date().getTime() - latestKeyCreatedAt.getTime() < 5 * 60 * 1000) {
            return { isNewKey: false, keyToReturn: latestKey };
        }

        return { isNewKey: true, keyToReturn: newKey };
    }

    private async handleSavingOfNewVerifyKey(
        backupStorageId: number,
        verifyKey: string,
        handshakeData: BackupStorageHandshakingDto,
        transactionalEntityManager: EntityManager,
        verifyKeys: BackupStorageVerifyKey[],
    ) {
        const topVerifyKeys: Partial<BackupStorageVerifyKey>[] = verifyKeys.slice(0, REVOKE_VERIFY_KEY_AFTER);

        const { isNewKey, keyToReturn } = this.getKeysToSaveAndNewOne(
            topVerifyKeys.map(vk => ({ key: vk.verifyKey, createdAt: vk.created_at })),
            verifyKey
        );

        if (isNewKey) {
            await transactionalEntityManager
                .getRepository(BackupStorageVerifyKey)
                .insert({
                    verifyKey: keyToReturn,
                    corporateId: handshakeData.corporateId,
                    backupStorageId,
                });

            // push new verify key at the start of the array and then slice it to get the top 3
            topVerifyKeys.unshift({ verifyKey: keyToReturn })
            const keysToKeep = topVerifyKeys.map(vk => vk.verifyKey).slice(0, REVOKE_VERIFY_KEY_AFTER);

            await transactionalEntityManager
                .getRepository(BackupStorageVerifyKey)
                .createQueryBuilder('backup_storage_verify_key')
                .delete()
                .where('backup_storage_verify_key.corporateId = :corporateId', { corporateId: handshakeData.corporateId })
                .andWhere('backup_storage_verify_key.backupStorageId = :backupStorageId', { backupStorageId })
                .andWhere('backup_storage_verify_key.verifyKey NOT IN (:...verifyKeys)', { verifyKeys: keysToKeep })
                .execute();
        }

        return keyToReturn;
    }

    private async handleSavingOfNewSessionKey(
        backupStorageId: number,
        sessionKey: string,
        handshakeData: BackupStorageHandshakingDto,
        transactionalEntityManager: EntityManager,
        allSessions: BackupStorageActiveSession[],
        expirationAfterHour: Date,
    ) {
        const topActiveSessions: Partial<BackupStorageActiveSession>[] = allSessions.slice(0, MAX_NUMBER_OF_ACTIVE_SESSIONS);

        const { isNewKey: isNewSession, keyToReturn: sessionKeyToReturn } = this.getKeysToSaveAndNewOne(
            topActiveSessions.map(as => ({ key: as.sessionKey, createdAt: as.created_at })),
            sessionKey
        );

        if (isNewSession) {
            await transactionalEntityManager
                .getRepository(BackupStorageActiveSession)
                .insert({
                    sessionKey: sessionKeyToReturn,
                    corporateId: handshakeData.corporateId,
                    backupStorageId,
                    expiresAt: expirationAfterHour,
                });

            // push new session key at the start of the array and then slice it to get the top 3
            topActiveSessions.unshift({ sessionKey: sessionKeyToReturn })
            const keysToKeep = topActiveSessions.map(as => as.sessionKey).slice(0, MAX_NUMBER_OF_ACTIVE_SESSIONS);
            await transactionalEntityManager
                .getRepository(BackupStorageActiveSession)
                .createQueryBuilder('backup_storage_active_session')
                .delete()
                .where('backup_storage_active_session.corporateId = :corporateId', { corporateId: handshakeData.corporateId })
                .andWhere('backup_storage_active_session.backupStorageId = :backupStorageId', { backupStorageId })
                .andWhere('backup_storage_active_session.sessionKey NOT IN (:...sessions)', { sessions: keysToKeep })
                .execute();
        }

        return sessionKeyToReturn;
    }

    async handshakeWithBackupStorage(
        handshakeData: BackupStorageHandshakingDto
    ): Promise<bridgeHandshakingResponseDto> {
        const expirationAfterHour = new Date();
        expirationAfterHour.setMinutes(expirationAfterHour.getMinutes() + BACKUP_STORAGE_EXPIRATION_TIME_IN_MINUTES);

        const backupStorage = await this.backupStorageVerifyKeyRepository.findOne({
            where: { verifyKey: handshakeData.verifyKey, corporateId: handshakeData.corporateId },
        });

        if (!backupStorage) {
            throw new ForbiddenException('Invalid verify key');
        }

        const verifyKey = this.generateVerifyKey();
        const sessionKey = SecureCommunicationService.generateSymmetricKey();

        await this.backupStorageRepository.update(
            { id: backupStorage.backupStorageId, corporateId: handshakeData.corporateId },
            { url: handshakeData.serverUrl },
        )

        const { newSessionKey, newVerifyKey } = await this.backupStorageRepository.manager.transaction(async (transactionalEntityManager: EntityManager) => {
            const verifyKeys = await transactionalEntityManager
                .getRepository(BackupStorageVerifyKey)
                .createQueryBuilder('verifyKey')
                .setLock('pessimistic_write')
                .where('verifyKey.corporateId = :corporateId', { corporateId: handshakeData.corporateId })
                .andWhere('verifyKey.backupStorageId = :backupStorageId', { backupStorageId: backupStorage.backupStorageId })
                .orderBy('verifyKey.created_at', 'DESC')
                .getMany();

            const allSessions = await transactionalEntityManager
                .getRepository(BackupStorageActiveSession)
                .createQueryBuilder('activeSession')
                .where('activeSession.corporateId = :corporateId', { corporateId: handshakeData.corporateId })
                .andWhere('activeSession.backupStorageId = :backupStorageId', { backupStorageId: backupStorage.backupStorageId })
                .orderBy('activeSession.expiresAt', 'DESC')
                .getMany();

            const newVerifyKey = await this.handleSavingOfNewVerifyKey(
                backupStorage.backupStorageId,
                verifyKey,
                handshakeData,
                transactionalEntityManager,
                verifyKeys
            );

            const newSessionKey = await this.handleSavingOfNewSessionKey(
                backupStorage.backupStorageId,
                sessionKey,
                handshakeData,
                transactionalEntityManager,
                allSessions,
                expirationAfterHour
            );

            return { newVerifyKey, newSessionKey };
        })

        return {
            sessionKey: newSessionKey,
            sessionExpirationDate: expirationAfterHour,
            id: backupStorage.backupStorageId,
            verifyKey: newVerifyKey,
            unencryptedFields: { backupStorageId: backupStorage.backupStorageId }
        };
    }

    async sendRequestToBackupStorage<T>(
        url: string,
        body: string,
        activeSessionKey: string,
        decryptResponse: boolean
    ): Promise<T> {
        const encryptedPayload = encryptAES256(
            body,
            activeSessionKey
        )

        const { data } = await firstValueFrom(
            this.httpService.post(url, encryptedPayload),
        );

        if (decryptResponse) {
            const decryptedData = decryptAES256(
                data,
                activeSessionKey
            )

            return JSON.parse(decryptedData);
        }

        return data;
    }
}