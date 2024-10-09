import { IsNotEmpty, IsString } from "class-validator";
import { IsId } from "src/libs/decorators/is-id.decorator";

export class SyncRequestDto {
    @IsId()
    vaultId: number;

    @IsString()
    @IsNotEmpty()
    publicKey: string;

    subdomain: string;
}
