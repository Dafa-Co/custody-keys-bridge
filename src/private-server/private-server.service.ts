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
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RMQ_KEYS_BRIDGE_FANOUT_EXCHANGE } from 'src/libs/constant/constant';
import { TenantService } from 'src/libs/decorators/tenant-service.decorator';
import { InjectCurrentCorporate } from 'src/libs/tenancy/inject-current-corporate';
import { subDomainSource } from 'src/libs/tenancy/utils';
import { mobileKey } from 'rox-custody_common-modules/libs/interfaces/push-key-to-mobile.interface';
import { IBridgeAdminRequest } from 'rox-custody_common-modules/libs/interfaces/bridge-admin-requrest.interface';
import { BackupStorageIntegrationService } from 'src/backup-storage-integration/backup-storage-integration.service';
import { IRequestDataFromApiApproval } from 'rox-custody_common-modules/libs/interfaces/send-to-backup-storage.interface';

@TenantService()
export class PrivateServerService {
  private readonly keyUpdatesSubject = new Subject<mobileKey>();

  constructor(
    @PrivateServerQueue() private readonly privateServerQueue: ClientProxy,
    private readonly amqpConnection: AmqpConnection,
    @InjectCurrentCorporate() private currentCorporate: subDomainSource,
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


    const storeIntoApiApprovalPayload: IRequestDataFromApiApproval = {
      ...apiApprovalEssential,
      data: {
        key: key.HalfOfPrivateKey,
        key_id: key.keyId,
      }
    };


    // store the key to the Api Approval
    await this.backupStorageIntegrationService.storeKeyToApiApproval(storeIntoApiApprovalPayload)

    // publish only if this is key for vault in the other cases it it will store the full key in the private server
    if(payload.vaultId) {
      this.BroadcastKey({
        content: key.HalfOfPrivateKey,
        keyId: key.keyId,
        vaultId: payload.vaultId
      })
    }


    const custodyKey: ICustodyKeyPairResponse = {
      address: key.address,
      keyId: key.keyId
    }


    return custodyKey;
  }


  BroadcastKey(dto: mobileKey) {
    dto[DBIdentifierRMQ] = this.currentCorporate.subdomain;

    // Notify other containers about the new keys
    this.amqpConnection.publish(RMQ_KEYS_BRIDGE_FANOUT_EXCHANGE, '', dto);

    this.pushDataToSSe(dto);
  }

  pushDataToSSe(data: mobileKey) {
    // Notify SSE subscribers about the new keys
    this.keyUpdatesSubject.next(data);
  }

  // SSE stream for key updates
  keysUpdatesSSe(iAdmin: IBridgeAdminRequest) {

    return new Observable((observer) => {
      // Subscribe to key updates
      const subscription = this.keyUpdatesSubject.subscribe((newKey) => {

        // validate this admin can receives this key
        const { vaultId } = newKey;

        // check the user have access for this corporate and the vault id inside the vault new keys
        if(
          iAdmin.vaultIds.includes(vaultId)
        ) {
          observer.next({ data: newKey });
        }
      });

      // Send heartbeat every 10 seconds
      const interval = setInterval(() => {
        observer.next({ data: 'heartbeat' });
      }, 10000);

      // Cleanup on disconnect
      return () => {
        subscription.unsubscribe(); // Unsubscribe from updates
        clearInterval(interval); // Clear heartbeat interval
        observer.complete(); // Complete the observable
      };
    });
  }
}
