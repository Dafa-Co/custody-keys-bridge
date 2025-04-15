import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { KeyNotFoundInSCM } from 'rox-custody_common-modules/libs/custom-errors/key-not-found-in-scm.exception';
import { SCMNotConnection } from 'rox-custody_common-modules/libs/custom-errors/scm-not-connected.exception';
import { backupStorageConnectionTypes, ICommunicatingWithBackupStorageForKeyManagement, IGetKeyFromBackupStorage, IRequestDataFromApiApproval, ISendRequestToBackupStorage } from 'rox-custody_common-modules/libs/interfaces/send-to-backup-storage.interface';
import { firstValueFrom } from 'rxjs';
import { VerifyKeyHeader } from 'src/libs/constant/api-approval-constant';
import { BackupStorage } from './entities/backup-storage.entity';
import { In, Repository } from 'typeorm';
import { BackupStorageHandshakingDto } from 'rox-custody_common-modules/libs/dtos/backup-storage-handshaking.dto';
import { GenerateBridgeScmDto } from 'rox-custody_common-modules/libs/dtos/generate-bridge-scm.dto';
import { v4 as uuidv4 } from 'uuid';
import { bridgeHandshakingResponseDto } from 'rox-custody_common-modules/libs/dtos/bridge-handshaking-response.dto';
import { BackupStorageCommunicationManagerService } from './backup-storage-communication-manager/backup-storage-communication-manager.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailEvents } from 'src/libs/constant/events.constants';
import { ISendEmailEvent } from 'src/libs/dto/send-email-event.dto';
import { MailStrategy } from 'src/mail/enums/mail-strategy.enum';
import { BackupStorageActiveSession } from './entities/backup-storage-active-session.entity';
import { getApiApprovalUrl } from 'rox-custody_common-modules/libs/utils/api-approval';
import { IEncryptedPayload } from 'rox-custody_common-modules/libs/services/secure-communication/interfaces/encrypted-payload.interface';
import { BACKUP_STORAGE_PRIVATE_KEY_INDEX_BREAKER } from './constants/backup-storage.constants';

@Injectable()
export class BackupStorageIntegrationService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(BackupStorage)
    private backupStorageRepository: Repository<BackupStorage>,
    private readonly backupStorageCommunicationManagerService: BackupStorageCommunicationManagerService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async getBackupStoragesInfo(
    backupStoragesIds: number[],
    corporateId: number,
    sortActiveSessions = false,
  ): Promise<BackupStorage[]> {
    const backupStorages = await this.backupStorageRepository
      .createQueryBuilder('backup_storage')
      .where('backup_storage.id IN (:...ids)', { ids: backupStoragesIds })
      .andWhere('backup_storage.corporateId = :corporateId', { corporateId })
      .leftJoinAndMapMany(
        'backup_storage.activeSessions',
        BackupStorageActiveSession,
        'activeSession',
        'activeSession.backupStorageId = backup_storage.id AND activeSession.corporateId = backup_storage.corporateId AND activeSession.expiresAt > NOW()',
      )
      .getMany();

    if (sortActiveSessions) {
      backupStorages.forEach((backupStorage) => {
        backupStorage.activeSessions = backupStorage.activeSessions.sort(
          (a, b) => b.expiresAt.getTime() - a.expiresAt.getTime()
        );
      })
    }

    return backupStorages;
  }

  private async communicatingWithBackupStorageForKeyManagement<T>(
    dto: ICommunicatingWithBackupStorageForKeyManagement & { payload: object },
    decryptResponse: boolean,
  ) {
    const { url, activeSessions, payload } = dto;

    for (const activeSession of activeSessions) {
      try {
        return await this.backupStorageCommunicationManagerService
          .sendRequestToBackupStorage<T>(
            url,
            JSON.stringify(payload),
            activeSession,
            decryptResponse,
          )
      } catch (error) {
        // if the status code is 404, that mean the key is not found in the api approval
        if (error?.response?.data.message?.toLowerCase() === 'file not found') {
          throw new KeyNotFoundInSCM();
        }
      }
    }

    throw new SCMNotConnection({
      message: `Backup storage with url ${url} is not connected`,
      backupStoragesIds: [dto.backupStorageId],
      privateKeyId: dto.privateKeyId,
    });
  }

  async storeKeyToApiApproval(dto: ISendRequestToBackupStorage): Promise<void> {
    const { url, sliceIndex, privateKeySlice, activeSessions, privateKeyId, backupStorageId } = dto;

    const payload = {
      key_id: dto.privateKeyId,
      key: `${sliceIndex}${BACKUP_STORAGE_PRIVATE_KEY_INDEX_BREAKER}${privateKeySlice}`
    }

    return this.communicatingWithBackupStorageForKeyManagement<void>({
      url,
      activeSessions,
      payload,
      backupStorageId,
      privateKeyId,
    }, false);
  }

  async getKeyFromApiApproval(
    dto: IGetKeyFromBackupStorage,
  ): Promise<string> {
    const { url, activeSessions, folderName, backupStorageId, privateKeyId } = dto;

    const payload = {
      key_id: dto.privateKeyId,
    }

    const results =
      await this.communicatingWithBackupStorageForKeyManagement<{ private_key: string }>({
        url: getApiApprovalUrl(
          url,
          backupStorageConnectionTypes.getKey,
          folderName,
        ),
        activeSessions,
        payload,
        backupStorageId,
        privateKeyId,
      }, true);

    if (!results.private_key) {
      throw new KeyNotFoundInSCM();
    }

    return results.private_key;
  }

  async handshakeWithBackupStorage(
    handshakeData: BackupStorageHandshakingDto
  ): Promise<bridgeHandshakingResponseDto> {
    return this.backupStorageCommunicationManagerService.handshakeWithBackupStorage(handshakeData);
  }

  generateVerifyKey(): string {
    return uuidv4().replace(/-/g, '').substring(0, 32);
  }

  async generateScm(dto: GenerateBridgeScmDto) {
    const verifyKey = this.generateVerifyKey()

    await this.backupStorageRepository.upsert({
      id: dto.id,
      corporateId: dto.corporateId,
    }, ['id'])

    await this.backupStorageCommunicationManagerService.saveVerifyKey(verifyKey, dto.corporateId, dto.id);

    const emailEvent: ISendEmailEvent<MailStrategy.VERIFY_KEY> = {
      type: MailStrategy.VERIFY_KEY,
      emails: dto.emails,
      payload: {
        name: dto.name,
        verifyKey,
      }
    }

    const results = this.eventEmitter.emit(
      EmailEvents.sendEmail,
      emailEvent,
    )
  }
}
