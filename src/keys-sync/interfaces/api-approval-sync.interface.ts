import { IRequestDataFromApiApproval } from "rox-custody_common-modules/libs/interfaces/send-to-backup-storage.interface";

export interface IApiApprovalSyncDto {
    apiApprovalData: IApiApprovalSyncInterface
    syncData: IRequestDataFromApiApproval;
}


export interface IApiApprovalSyncInterface {
    keysIds: number[];
    publicKey: string;
}
