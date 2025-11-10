import { MailStrategyPayloads } from "src/mail/interfaces/mails-options-strategy.interface";

export class ISendEmailEvent<StrategyType extends keyof typeof MailStrategyPayloads> {
    emails: string[];
    payload: InstanceType<(typeof MailStrategyPayloads)[StrategyType]>;
    type: StrategyType;
}