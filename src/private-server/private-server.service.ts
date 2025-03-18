import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ICustodyKeyPairResponse, IGenerateKeyPairResponse } from 'rox-custody_common-modules/libs/interfaces/generate-ket-pair.interface';
import {
  _EventPatterns,
  _MessagePatterns,
  DBIdentifierRMQ,
} from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { GenerateKeyPairBridge } from 'rox-custody_common-modules/libs/interfaces/generate-key.interface';
import { PrivateServerQueue } from 'src/libs/rmq/private-server.decorator';
import { TenantService } from 'src/libs/decorators/tenant-service.decorator';
import { mobileKey } from 'rox-custody_common-modules/libs/interfaces/push-key-to-mobile.interface';
import { BackupStorageIntegrationService } from 'src/backup-storage-integration/backup-storage-integration.service';
import { IRequestDataFromApiApproval } from 'rox-custody_common-modules/libs/interfaces/send-to-backup-storage.interface';

@TenantService()
export class PrivateServerService {
  private readonly keyUpdatesSubject = new Subject<mobileKey>();

  constructor(
    @PrivateServerQueue() private readonly privateServerQueue: ClientProxy,
    private readonly backupStorageIntegrationService: BackupStorageIntegrationService
  ) {}


  async generateKeyPair(
    payload: GenerateKeyPairBridge,
  ): Promise<ICustodyKeyPairResponse> {

    const { apiApprovalEssential } = payload;

    const key = await firstValueFrom(
      this.privateServerQueue.send<IGenerateKeyPairResponse>(
        { cmd: _MessagePatterns.generateKey },
        payload,
      ),
    );

    // publish only if this is key for vault in the other cases it it will store the full key in the private server
    if(payload.vaultId) {
      const storeIntoApiApprovalPayload: IRequestDataFromApiApproval = {
        ...apiApprovalEssential,
        data: {
          key: key.HalfOfPrivateKey,
          key_id: key.keyId,
        }
      };

      // store the key to the Api Approval
      await this.backupStorageIntegrationService.storeKeyToApiApproval(storeIntoApiApprovalPayload)
    }

    const custodyKey: ICustodyKeyPairResponse = {
      address: key.address,
      keyId: key.keyId
    }

    return custodyKey;
  }
}
