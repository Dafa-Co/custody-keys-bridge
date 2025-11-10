import { VerifyKeyEmailStrategyPayload } from "src/libs/dto/verify-key-email-strategy-payload.dto";
import { MailStrategy } from "../enums/mail-strategy.enum";

export interface IMailOptionsStrategy<StrategyType extends keyof typeof MailStrategyPayloads> {
    getMailOptions(
        payload: InstanceType<(typeof MailStrategyPayloads)[StrategyType]>,
    ): Promise<IPartialMailOptions>;
}

export interface IPartialMailOptions {
    subject: string;
    text: string;
    html: string;
}


export const MailStrategyPayloads = {
    [MailStrategy.VERIFY_KEY]: VerifyKeyEmailStrategyPayload,
}
