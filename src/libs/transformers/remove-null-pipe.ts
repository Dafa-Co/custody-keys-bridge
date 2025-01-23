import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { TenantService } from '../decorators/tenant-service.decorator';


const keysToSkip = ['website']

@TenantService()
export class RemoveNullKeysPipe implements PipeTransform {
  private isObj(value: any): boolean {
    return typeof value === 'object' && value !== null;
  }

  private removeNullKeys(obj: any): any {
    if (!this.isObj(obj)) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeNullKeys(item));
    }

    const cleanedObj = {};
    for (const [key, value] of Object.entries(obj)) {

      if (keysToSkip.includes(key)) {
        cleanedObj[key] = value;
        continue;
      }

      if (value === null) {
        continue;
      }
      if (this.isObj(value)) {
        cleanedObj[key] = this.removeNullKeys(value);
      } else {
        cleanedObj[key] = value;
      }
    }

    return cleanedObj;
  }

  transform(value: any, metadata: ArgumentMetadata) {
    const { type } = metadata;

    if (this.isObj(value) && type === 'body') {
        return this.removeNullKeys(value);
    }
    return value;
  }
}
