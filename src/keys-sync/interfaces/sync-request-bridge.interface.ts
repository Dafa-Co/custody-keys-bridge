import { IAdminRequest } from "src/libs/interfaces/admin-requrest.interface";

export interface ISyncRequestBridge {
    admin: IAdminRequest;
    vaultId: number;
}

export interface ISyncRequestBridgeResponse {
    apiApprovalUrl: string;
    verifyKey: string;
}
