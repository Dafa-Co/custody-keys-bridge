import { Injectable } from "@nestjs/common";
import { IMailsStrategy, IMailStrategyReturnedData } from "../interfaces/mails-strategy.interface";
import { readFile } from 'fs/promises';
import { join } from "path";
import { MailStrategy } from "../enums/mail-strategy.enum";
import { VerifyKeyEmailStrategyPayload } from "src/libs/dto/verify-key-email-strategy-payload.dto";

@Injectable()
export class VerifyKeyStrategy implements IMailsStrategy<MailStrategy.VERIFY_KEY> {
    async getMailOptions(payload: VerifyKeyEmailStrategyPayload): Promise<IMailStrategyReturnedData> {
        const verifyKeyTemplate = await readFile(
            join(__dirname, `./templates/backup-storage-verify-key.template.html`),
            { encoding: 'utf-8' },
        );

        let htmlTemplate = verifyKeyTemplate.replace(`{{scm_key}}`, payload.verifyKey);
        htmlTemplate = htmlTemplate.replace(`{{scm_name}}`, payload.name);

        return {
            subject: `Verify key of ${payload.name}`,
            text: `Verify key of ${payload.name}`,
            html: htmlTemplate,
        };
    }

}