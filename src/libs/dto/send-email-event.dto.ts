import { EmailsStrategies } from "src/mail/interfaces/mails-strategy.interface";

export class ISendEmailEvent<StrategyType extends keyof typeof EmailsStrategies> {
    emails: string[];
    payload: InstanceType<(typeof EmailsStrategies)[StrategyType]>;
    type: StrategyType;
}