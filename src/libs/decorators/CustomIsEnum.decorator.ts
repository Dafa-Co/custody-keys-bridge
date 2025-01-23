import { applyDecorators } from '@nestjs/common';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsEnum, IsNotEmpty, ValidationArguments } from 'class-validator';

export function CustomIsEnum(enumType: any, errorMessage?: string) {
  return applyDecorators(
    IsNotEmpty(),
    IsEnum(enumType, {
      message: (args: ValidationArguments) =>
        errorMessage
          ? errorMessage
          : `Invalid value for property '${args.property}'. It should be one of these values: ${Object.keys(
              enumType,
            )
              .filter((v) => !(Number(v) + 1))
              .join(', ')}`,
    }),
    Transform((params: TransformFnParams) => {
      const value = params.value;

      if (typeof value === 'number') return value;

      if (enumType[Object.keys(enumType).find((key) => key === value)] != undefined) {
        return enumType[Object.keys(enumType).find((key) => key === value)];
      }

      return value;
    }),
  );
}
