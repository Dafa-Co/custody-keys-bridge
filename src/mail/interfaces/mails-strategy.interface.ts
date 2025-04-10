import { VerifyKeyEmailStrategyPayload } from "src/libs/dto/verify-key-email-strategy-payload.dto";
import { MailStrategy } from "../enums/mail-strategy.enum";

export interface IMailsStrategy<StrategyType extends keyof typeof EmailsStrategies> {
    getMailOptions(
        payload: InstanceType<(typeof EmailsStrategies)[StrategyType]>,
    ): Promise<IMailStrategyReturnedData>;
}

export interface IMailStrategyReturnedData {
    subject: string;
    text: string;
    html: string;
}


export const EmailsStrategies = {
    [MailStrategy.VERIFY_KEY]: VerifyKeyEmailStrategyPayload,
}
