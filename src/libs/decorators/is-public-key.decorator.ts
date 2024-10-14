import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsValidPublicKey(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidPublicKey',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const pemRegex = /-----BEGIN PUBLIC KEY-----\n([A-Za-z0-9+/=\n]+)\n-----END PUBLIC KEY-----/;
          return typeof value === 'string' && pemRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'publicKey must be in a valid PEM format';
        },
      },
    });
  };
}
