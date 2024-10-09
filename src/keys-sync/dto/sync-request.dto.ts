import { IsNotEmpty, IsString } from "class-validator";
import { IsId } from "src/libs/decorators/is-id.decorator";
import { IAdminRequest } from "src/libs/interfaces/admin-requrest.interface";

export class SyncRequestDto {
    @IsId()
    vaultId: number;

    @IsString()
    @IsNotEmpty()
    publicKey: string;

    // from decorators
    subdomain: string;
    admin: IAdminRequest
}
