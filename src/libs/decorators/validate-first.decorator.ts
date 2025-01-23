import { Transform, TransformFnParams, TransformOptions } from 'class-transformer';

export function ValidateThenTransform(
  transformFn: (params: TransformFnParams) => any,
  options?: TransformOptions,
) {
  return Transform(transformFn, {
    ...options,
    toClassOnly: true,
    groups: [validationFirstLabel],
  });
}

export const validationFirstLabel = 'validationFirst';
