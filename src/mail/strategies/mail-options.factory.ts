import { Injectable } from "@nestjs/common";
import { VerifyKeyOptionsStrategy } from "./verify-key.strategy";
import { MailStrategy } from "../enums/mail-strategy.enum";
import { MailDataRequired } from "@sendgrid/mail";
import { configs } from "src/configs/configs";
import { IPartialMailOptions } from "../interfaces/mails-options-strategy.interface";

@Injectable()
export class MailOptionsFactory {
    constructor(
        private readonly verifyKeyStrategy: VerifyKeyOptionsStrategy,
    ) {}

    async create(type: MailStrategy, emails: string[], payload: any): Promise<MailDataRequired> {
        let mailsOptions: IPartialMailOptions;

        switch (type) {
            case MailStrategy.VERIFY_KEY:
                mailsOptions = await this.verifyKeyStrategy.getMailOptions(payload);
                break;
            default:
                throw new Error(`Unknown mail type: ${type}`);
        }
        
        return {
            ...mailsOptions,
            from: `RoxCustody <${configs.SENDGRID_EMAIL}>`,
            to: emails,
        };
    }
}