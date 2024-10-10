import { IsNumber, IsString } from '@nestjs/class-validator';
import { Transform } from 'class-transformer';
import {
  // IsEnum,
  // IsIn,
  IsNotEmpty,
  IsOptional,
  IsPositive,
} from 'class-validator';
import {
  AbstractEntity,
  AllowedFilterTypes,
  EntityFilterElementType,
  EntitySearchElementType,
  InValidation,
  NotHave
} from './abstract.entity';

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { In, Not } from 'typeorm';
import { CustomIsEnum } from '../decorators/CustomIsEnum.decorator';

function IsInDynamicArray(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isInDynamicArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const allowedArray = args.object[property];
          return Array.isArray(allowedArray) && allowedArray.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          const propertyName = args.property;
          const allowedValues = args.object[property];

          if (allowedValues.length === 0) {
            return `${propertyName} does not have any allowed values.`;
          }

          return `${propertyName} must be one of the values in ${allowedValues}`;
        },
      },
    });
  };
}

function validateEnumType(
  fieldValue: any,
  enumType: object,
  args: ValidationArguments,
) {
  if (!Object.values(enumType).includes(fieldValue)) {
    return null;
  }

  if(typeof fieldValue === 'number') return fieldValue;

  const foundedValue = Object.keys(enumType).find((key) => key == fieldValue);
  const targetEnumValue = enumType[foundedValue];

  const returnTheValue =
    targetEnumValue != undefined && targetEnumValue != null;

  return returnTheValue ? targetEnumValue : null;
}

function validateNumberType(fieldValue: any, args: ValidationArguments) {
  const parsedValue = parseInt(fieldValue);
  if (isNaN(parsedValue)) {
    return false;
  }
  return parsedValue;
}

function validateStringType(fieldValue: any, args: ValidationArguments) {
  if (typeof fieldValue !== 'string') {
    return false;
  }
  return true;
}

function validateBooleanType(fieldValue: any, args: ValidationArguments) {
  const lowerString = fieldValue.toString().toLowerCase();
  if (lowerString !== 'true' && lowerString !== 'false') {
    return false;
  }
  return lowerString === 'true';
}

function validateDateType(fieldValue: any, args: ValidationArguments) {
  const dateValue = new Date(fieldValue);
  if (isNaN(dateValue.getTime())) {
    return false;
  }
  return dateValue;
}

function validateNullableNumberType(
  fieldValue: any,
  args: ValidationArguments,
) {
  const parsedValue = parseInt(fieldValue);
  return isNaN(parsedValue) ? null : parsedValue;
}

function validateInType(
  fieldValue: any,
  validation: EntityFilterElementType,
  args: ValidationArguments,
  notIn: boolean = false,
) {
  // Check if the fieldValue is an instance of FindOperator
  if (fieldValue && fieldValue['@instanceof'] === Symbol.for('FindOperator')) {
    return fieldValue; // Return the object itself
  }
  // Determine the correct regex pattern based on the notIn flag
  const pattern = notIn ? /^notin\(([^)]+)\)$/i : /^in\(([^)]+)\)$/i;

  // Validate the shape of the value; it should match the pattern for In or NotIn
  const regex = new RegExp(pattern);
  const match = regex.exec(fieldValue);
  if (!match) {
    return false;
  }

  // Extract the values from the IN/NotIn clause
  const values: any[] = match[1].split(',').map((val) => val.trim());

  // Determine the validation type from the inValidationType
  const inValidationType = InValidation[validation.inValidation];

  const isValid = values.every((val) => {
    switch (inValidationType) {
      case InValidation.number:
        return validateNumberType(val, args);
      case InValidation.string:
        return validateStringType(val, args);
      case InValidation.enum:
        return validateEnumType(val, validation.enum, args) != null;
      default:
        return false;
    }
  });

  if (!isValid) {
    args.constraints[2] = values; // Store the invalid values for error messaging
    return false;
  }

  // parse the values to the correct type
  values.forEach((val, index) => {
    switch (inValidationType) {
      case InValidation.number:
        values[index] = parseInt(val);
        break;
      case InValidation.enum:
        values[index] = validateEnumType(val, validation.enum, args);
        break;
    }
  });

  return notIn ? Not(In(values)) : In(values);
}

function validateNotHaveType(
  fieldValue: any,
  validation: EntityFilterElementType,
  args: ValidationArguments,
) {
  // check if the value is an instance of NotHave interface
  if (NotHave.isNotHave(fieldValue)) {
    return fieldValue;
  }

  // Define the regex pattern to match notHave with a specific type, e.g., notHave(number)
  const pattern = /^nothave\(([^)]+)\)$/i;

  // Validate the shape of the value; it should match the pattern for In or NotIn
  const regex = new RegExp(pattern);
  const match = regex.exec(fieldValue);
  if (!match) {
    return false;
  }

  // Extract the values from the IN/NotIn clause
  const values: any[] = match[1].split(',').map((val) => val.trim());

  // Determine the validation type from the inValidationType
  const inValidationType = InValidation[validation.inValidation];

  const isValid = values.every((val) => {
    switch (inValidationType) {
      case InValidation.number:
        return validateNumberType(val, args);
      case InValidation.string:
        return validateStringType(val, args);
      case InValidation.enum:
        return validateEnumType(val, validation.enum, args) != null;
      default:
        return false;
    }
  });

  if (!isValid) {
    args.constraints[2] = values;
    return false;
  }

  // parse the values to the correct type
  values.forEach((val, index) => {
    switch (inValidationType) {
      case InValidation.number:
        values[index] = parseInt(val);
        break;
      case InValidation.string:
        values[index] = val;
        break;
      case InValidation.enum:
        values[index] = validateEnumType(val, validation.enum, args);
        break;
    }
  });



  const notHave: NotHave = {
    notHave: values,
  };

  return notHave;
}

function IsInDynamicObject(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isInDynamicObject',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: object, args: ValidationArguments) {
          const allowedObjects: EntityFilterElementType[] =
            args.object[property];

          const allowedKey = allowedObjects.map((obj) => obj.key);

          const keys = Object.keys(value);

          const allExist = keys.every((key) => allowedKey.includes(key));

          if (!allExist) {
            args.constraints[0] = 'non-allowedKey';
            return false;
          }

          const allValuesAreValid = keys.every((key) => {
            const obj = allowedObjects.find((obj) => obj.key === key);
            if (!obj) {
              return false;
            }

            const fieldType = Array.isArray(obj.type) ? obj.type : [obj.type];
            args.constraints[1] = key;
            args.constraints[0] = fieldType;

            let fieldValue = value[key];
            let valid;

            const keyResult = fieldType.some((type) => {
              switch (type) {
                case AllowedFilterTypes.enum:
                  const enumType = obj.enum;
                  valid = validateEnumType(fieldValue, obj.enum, args);
                  if (valid == undefined || valid == null) return false;
                  value[key] = valid;
                  break;

                case AllowedFilterTypes.number:
                  valid = validateNumberType(fieldValue, args);
                  if (!valid) return false;
                  value[key] = fieldValue;
                  break;

                case AllowedFilterTypes.string:
                  valid = validateStringType(fieldValue, args);
                  if (!valid) return false;
                  break;

                case AllowedFilterTypes.boolean:
                  const lowerString = fieldValue.toString().toLowerCase();
                  valid = validateBooleanType(fieldValue, args);
                  if (!valid) return false;
                  value[key] = valid;
                  break;

                case AllowedFilterTypes.date:
                  const dateValue = new Date(fieldValue);
                  valid = validateDateType(fieldValue, args);
                  if (!valid) return false;
                  value[key] = valid;
                  break;

                case AllowedFilterTypes.nullableNumber:
                  fieldValue = parseInt(fieldValue);
                  valid = validateNullableNumberType(fieldValue, args);
                  value[key] = valid;
                  break;

                case AllowedFilterTypes.In:
                  let values = validateInType(fieldValue, obj, args);
                  if (!values) return false;
                  value[key] = values;
                  break;

                case AllowedFilterTypes.NotIn:
                  let values2 = validateInType(fieldValue, obj, args, true);
                  if (!values2) return false;
                  value[key] = values2;
                  break;

                case AllowedFilterTypes.notHave:
                  let values3 = validateNotHaveType(fieldValue, obj, args);
                  if (!values3) return false;
                  value[key] = values3;
                  break;

                default:
                  args.constraints[0] = 'noMatch';
                  return false;
              }
              return true;
            });

            return keyResult;
          });

          return allValuesAreValid;
        },
        defaultMessage(args: ValidationArguments) {
          const propertyName = args.property;
          const allowedObjects: EntityFilterElementType[] =
            args.object[property];
          const allowedKey = allowedObjects.map((obj) => obj.key);

          switch (args.constraints[0]) {
            case 'non-allowedKey':
              return `${propertyName} must have valid values according to ${allowedKey}.`;

            case 'noMatch':
              return `no operator that matches the value for ${args.constraints[1]}.`;

            case 'inFormat':
            default:
              return `The value for property '${args.constraints[1]}' must be of type ${args.constraints[0].map(
                (type) => {
                  let result = `${type}`;
                  if (type == AllowedFilterTypes.enum) {
                    result += `[${Object.values(allowedObjects.find((obj) => obj.key === args.constraints[1]).enum).filter((v) => !(Number(v) + 1))}] `;
                  } else if (
                    type == AllowedFilterTypes.In ||
                    type == AllowedFilterTypes.NotIn ||
                    type == AllowedFilterTypes.notHave
                  ) {
                    const inValidationType = allowedObjects.find(
                      (obj) => obj.key === args.constraints[1],
                    ).inValidation;

                    if (inValidationType == InValidation.enum) {
                      return (result += `(${Object.values(allowedObjects.find((obj) => obj.key === args.constraints[1]).enum).filter((v) => !(Number(v) + 1))})`);
                    } else {
                      result += `(${inValidationType}, ${inValidationType})`;
                    }
                  }
                  return result;
                },
              )}.`;
          }
        },
      },
    });
  };
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class FilterInterface {
  @IsOptional()
  entitySortKeys?: string[] = [];
  @IsOptional()
  entitySearchKey?: EntitySearchElementType[] = [];
  @IsOptional()
  entityFilterKeys?: EntityFilterElementType[] = [];

  constructor(targetEntity: AbstractEntity) {
    this.entitySortKeys = targetEntity?.sortKeys || [];
    this.entitySearchKey = targetEntity?.searchKeys || [];
    this.entityFilterKeys = targetEntity?.filterKeys || [];
  }

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Transform((pageString) => parseInt(pageString.value))
  page: number = 1;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Transform((pageString) => parseInt(pageString.value))
  limit: number = 10;

  @IsOptional()
  @CustomIsEnum(SortOrder)
  order: SortOrder;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  search: string;

  @IsOptional()
  @IsNotEmpty()
  @IsInDynamicArray('entitySortKeys')
  sort_key: string;

  @IsOptional()
  @IsNotEmpty()
  @IsInDynamicObject('entityFilterKeys')
  filters: object = {};
}
