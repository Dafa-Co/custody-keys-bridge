import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IGenerateKeyPairResponse } from 'rox-custody_common-modules/libs/interfaces/generate-ket-pair.interface';
import { _MessagePatterns } from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { firstValueFrom } from 'rxjs';
import { GenerateKeyPairBridge } from 'rox-custody_common-modules/libs/interfaces/generate-key.interface';
import { PrivateServerQueue } from 'src/libs/rmq/private-server.decorator';

@Injectable()
export class PrivateServerService {
  constructor(
    @PrivateServerQueue() private readonly privateServerQueue: ClientProxy,
  ) {}

  async generateKeyPair(
    payload: GenerateKeyPairBridge,
  ): Promise<IGenerateKeyPairResponse> {
    const keys = await firstValueFrom(
        this.privateServerQueue.send(
          { cmd: _MessagePatterns.generateKey },
          payload,
        ),
      );

      return keys
  }
}
