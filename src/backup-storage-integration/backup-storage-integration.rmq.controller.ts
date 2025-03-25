import { MessagePattern, Payload } from '@nestjs/microservices';
import { _EventPatterns, _MessagePatterns } from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { RmqController } from 'rox-custody_common-modules/libs/decorators/rmq-controller.decorator';
import { BackupStorageHandshakingDto } from 'rox-custody_common-modules/libs/dtos/backup-storage-handshaking.dto';
import { BackupStorageIntegrationService } from './backup-storage-integration.service';
import { GenerateBridgeScmDto } from 'rox-custody_common-modules/libs/dtos/generate-bridge-scm.dto';
import { EncryptedMessagePattern } from 'rox-custody_common-modules/libs/services/secure-communication/interceptor/decrypt-payload.interceptor';
import { DecryptedPayload } from 'rox-custody_common-modules/libs/services/secure-communication/decorators/decrypted-payload.decorator';

@RmqController()
export class BackupStorageIntegrationRmqController {
  constructor(
    private readonly backupStorageIntegrationService: BackupStorageIntegrationService
  ) { }

  // @MessagePattern({ cmd: _MessagePatterns.bridge.handshaking })
  @EncryptedMessagePattern({ cmd: _MessagePatterns.bridge.handshaking })
  async handshaking(
    @DecryptedPayload() dto: BackupStorageHandshakingDto
  ) {
    console.log('handshaking dto:', dto);
    return dto;
    // return this.backupStorageIntegrationService.handshakeWithBackupStorage(dto);
  }

  @MessagePattern({ cmd: _MessagePatterns.bridge.generateScm })
  async generateScm(
    @Payload() dto: GenerateBridgeScmDto
  ) {
    await this.backupStorageIntegrationService.generateScm(dto);

    return { message: 'success' };
  }
}
