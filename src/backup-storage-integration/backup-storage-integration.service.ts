import { HttpService } from '@nestjs/axios';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { KeyNotFoundInSCM } from 'rox-custody_common-modules/libs/custom-errors/key-not-found-in-scm.exception';
import { SCMNotConnection } from 'rox-custody_common-modules/libs/custom-errors/scm-not-connected.exception';
import { IRequestDataFromApiApproval } from 'rox-custody_common-modules/libs/interfaces/send-to-backup-storage.interface';
import { generateKeyPair } from 'rox-custody_common-modules/libs/utils/generate-key-pair.utils';
import { firstValueFrom } from 'rxjs';
import { VerifyKeyHeader } from 'src/libs/constant/api-approval-constant';
import { BackupStorage } from './entities/backup-storage.entity';
import { Repository } from 'typeorm';
import { BackupStorageHandshakingDto } from 'rox-custody_common-modules/libs/dtos/backup-storage-handshaking.dto';
import { GenerateBridgeScmDto } from 'rox-custody_common-modules/libs/dtos/generate-bridge-scm.dto';
import { v4 as uuidv4 } from 'uuid';
import { bridgeHandshakingResponseDto } from 'rox-custody_common-modules/libs/dtos/bridge-handshaking-response.dto';

@Injectable()
export class BackupStorageIntegrationService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(BackupStorage)
    private backupStorageRepository: Repository<BackupStorage>,
  ) { }

  async storeKeyToApiApproval(dto: IRequestDataFromApiApproval): Promise<void> {
    await this.sendToBackupStorage(dto);
  }

  async getKeyFromApiApproval(
    dto: IRequestDataFromApiApproval,
  ): Promise<string> {
    const resData = await this.sendToBackupStorage(dto);

    return resData.private_key;
  }

  private async sendToBackupStorage(
    dto: IRequestDataFromApiApproval,
  ): Promise<any> {
    const { apiApprovalUrl, verifyKey, data } = dto;

    // encrypt the data with the public key and private key

    try {
      const response = await firstValueFrom(
        this.httpService.post(apiApprovalUrl, data, {
          headers: {
            [VerifyKeyHeader]: verifyKey,
          },
        }),
      );
      return response.data;
    } catch (error) {

      // if the status code is 404, that mean the key is not found in the api approval
      if (error?.response?.data.message === 'File not found') {
        throw new KeyNotFoundInSCM();
      }

      throw new SCMNotConnection();
    }
  }

  async handshakeWithBackupStorage(
    handshakeData: BackupStorageHandshakingDto
  ): Promise<bridgeHandshakingResponseDto> {
    const keys = await generateKeyPair();

    const expirationAfterHour = new Date();
    expirationAfterHour.setHours(expirationAfterHour.getHours() + 1);

    const backupStorage = await this.backupStorageRepository.findOne({
      where: { verifyKey: handshakeData.verifyKey },
      select: ['id'],
    });

    if (!backupStorage) {
      throw new ForbiddenException('Invalid verify key');
    }

    const updateResults = await this.backupStorageRepository.update(
      { id: backupStorage.id, corporateId: handshakeData.corporateId },
      {
        backupStoragePublicKey: handshakeData.publicKey,
        identityVerificationPrivateKey: keys.privateKey,
        sessionExpirationDate: expirationAfterHour,
        url: handshakeData.serverUrl,
      }
    );

    if (updateResults.affected === 0) {
      throw new ForbiddenException('Invalid verify key');
    }

    return { publicKey: keys.publicKey, id: backupStorage.id };
  }

  generateVerifyKey(): string {
    return uuidv4().replace(/-/g, '').substring(0, 32);
  }

  async generateScm(dto: GenerateBridgeScmDto) {
    const verifyKey = this.generateVerifyKey();

    await this.backupStorageRepository.upsert({
      id: dto.id,
      verifyKey,
      corporateId: dto.corporateId,
    }, ['id']);
  }
}
