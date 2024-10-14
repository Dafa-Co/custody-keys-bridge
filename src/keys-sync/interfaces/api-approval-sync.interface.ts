import { ISyncRequestBridgeResponse } from "./sync-request-bridge.interface";

export interface IApiApprovalSyncDto {
    apiApprovalData: IApiApprovalSyncInterface
    syncData: ISyncRequestBridgeResponse;
}


export interface IApiApprovalSyncInterface {
    keysIds: number[];
    publicKey: string;
}
