import { applyDecorators } from '@nestjs/common';
import { registerDecorator, ValidationOptions, ValidationArguments, Validate, IsNumber, IsString } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { ValidateThenTransform } from './validate-first.decorator';

export function SelectAllValidator(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: `SelectAllValidator`,
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(array: any[], args: ValidationArguments) {

          if (array === undefined) {
            args.constraints.push(`required`);
            return false;
          }

          if (!Array.isArray(array)) {
            args.constraints.push(`typeArray`);
            return false;
          }

          if (array.length === 0) {
            args.constraints.push(`notEmpty`);
            return false;
          }

          if (array.length === 1 && array[0] === undefined) {
            return true;
          }

          const isValid = array.every(
            element => typeof element === `number` && (element > 0 || element === -1)
          );

          if (!isValid) {
            args.constraints.push(`validElements`);
            return false;
          }


          return true;  // All validations passed
        },
        defaultMessage(args: ValidationArguments) {
          const constraint = args.constraints[0];
          switch (constraint) {
            case `required`:
              return `The ${propertyName} field is required.`;
            case `typeArray`:
              return `The ${propertyName} must be an array.`;
            case `notEmpty`:
              return `The ${propertyName} array must not be empty.`;
            case `validElements`:
              const invalidItems = args.value.filter(
                x => !(typeof x === `number` && (x > 0 || x === -1))
              );
              return `Invalid asset IDs: ${invalidItems.join(`, `)}. Each value must be larger than 0 or equal to -1.`;
            default:
              return `Invalid input in ${propertyName} field.`;
          }
        },
      },
    });

  };
}

export function IsSelectAllArray() {
  return applyDecorators(
    SelectAllValidator(),
    ValidateThenTransform((params: TransformFnParams) => {
      let array: number[] = params.value;
      array = array.includes(-1) ? [undefined] : array;
      return array;
    })
);
}

export function IsSelectAll(arr: any[]) {
  return arr.length == 1 && arr[0] == undefined;
}
