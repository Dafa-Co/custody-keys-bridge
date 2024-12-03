import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { SCMNotConnection } from 'rox-custody_common-modules/libs/custom-errors/scm-not-connected.exception';
import { IRequestDataFromApiApproval } from 'rox-custody_common-modules/libs/interfaces/send-to-backup-storage.interface';
import { firstValueFrom } from 'rxjs';
import { VerifyKeyHeader } from 'src/libs/constant/api-approval-constant';

@Injectable()
export class BackupStorageIntegrationService {
  constructor(private readonly httpService: HttpService) {}

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
      console.log("error", error.response.data)
      throw new SCMNotConnection();
    }
  }
}
