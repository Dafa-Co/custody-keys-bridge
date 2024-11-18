import * as path from 'path';
import { EventEmitterConstantName, HTTP, JOB, RabbitMQ } from 'rox-custody_common-modules/libs/utils/request-type-constants';
import { SyncRequest } from 'src/keys-sync/entities/sync-request.entity';
import { DataSource } from 'typeorm';
import { DBIdentifierJOB, DBIdentifierRMQ } from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { GoneException } from '@nestjs/common';

export enum subDomainSourceEnum {
  HTTP = 'HTTP',
  RMQ = 'RMQ',
  JOB = 'JOB',
  EVENTEMITTER = 'EVENTEMITTER',
}

export interface subDomainSource {
  source: subDomainSourceEnum;
  subdomain: string;
}

export function extractSubdomain(request: any): subDomainSource {
  if (request.constructor.name === RabbitMQ) {
    return {
      source: subDomainSourceEnum.RMQ,
      subdomain: request?.data[DBIdentifierRMQ],
    };
  } else if (request.constructor.name === HTTP) {
    let subdomain = request.headers.host.split('.')[0];

    return {
      source: subDomainSourceEnum.HTTP,
      subdomain: subdomain,
    };
  } else if (request.constructor.name === JOB) {
    return {
      source: subDomainSourceEnum.JOB,
      subdomain: request.data[DBIdentifierJOB],
    };
  } else if (request.constructor.name === EventEmitterConstantName){
    return {
      source: subDomainSourceEnum.EVENTEMITTER,
      subdomain: request?.subdomain,
    };
  }

  throw new GoneException('Invalid Request');
}

export function createCorporateDataSource(
  corporateDatabase: string,
): DataSource {
    // Resolve the path to the database using path.resolve()
    const databasePath = path.resolve(process.cwd(), 'database', `${corporateDatabase}.sqlite`);

  return new DataSource({
    type: 'sqlite',
    synchronize: true,
    database: databasePath,
    entities: [SyncRequest],
  });
}

export const subDomainRequestKey = 'subDomainRequestKey';

