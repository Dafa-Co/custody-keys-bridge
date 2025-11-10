import { Injectable } from "@nestjs/common";
import { VerifyKeyStrategy } from "./verify-key.strategy";
import { MailStrategy } from "../enums/mail-strategy.enum";
import { MailDataRequired } from "@sendgrid/mail";
import { configs } from "src/configs/configs";
import { IMailStrategyReturnedData } from "../interfaces/mails-strategy.interface";

@Injectable()
export class MailsStrategiesService {
    constructor(
        private readonly verifyKeyStrategy: VerifyKeyStrategy,
    ) {}

    async getMailOptions(type: MailStrategy, emails: string[], payload: any): Promise<MailDataRequired> {
        let mailsOptions: IMailStrategyReturnedData;

        switch (type) {
            case MailStrategy.VERIFY_KEY:
                mailsOptions = await this.verifyKeyStrategy.getMailOptions(payload);
                break;
            default:
                throw new Error(`Unknown mail type: ${type}`);
        }
        
        return {
            ...mailsOptions,
            from: `RoxCustody <${configs.EMAIL_SENDER}>`,
            to: emails,
        };
    }
}