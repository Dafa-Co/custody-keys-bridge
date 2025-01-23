import { IsNotEmpty, IsString } from "class-validator";
import { IsId } from "src/libs/decorators/is-id.decorator";
import { IsValidPublicKey } from "src/libs/decorators/is-public-key.decorator";
import { IsSelectAllArray } from "src/libs/decorators/select-all.decorator";
import { IBridgeAdminRequest } from "rox-custody_common-modules/libs/interfaces/bridge-admin-requrest.interface";

export class SyncRequestDto {
    @IsId()
    vaultId: number;

    @IsString()
    @IsNotEmpty()
    @IsValidPublicKey({ message: 'The public key provided is not valid.' })
    publicKey: string;

    @IsSelectAllArray()
    keysIds: number[];

    // from decorators
    admin: IBridgeAdminRequest
}
