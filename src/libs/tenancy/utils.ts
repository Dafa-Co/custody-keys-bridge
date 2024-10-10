import * as path from 'path';
import { SyncRequest } from 'src/keys-sync/entities/sync-request.entity';
import { DataSource } from 'typeorm';

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
  const requestParts = request.headers.host.split('.');
  if (requestParts.length === 1) {
    return undefined;
  }

  // extract the subdomain from the request
  // this is a very basic implementation and should be improved
  return {
    source: subDomainSourceEnum.HTTP,
    subdomain: requestParts[0],
  };
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
export const TENANT_CONNECTION = 'TENANT_CONNECTION';export const subDomainRequestKey = 'subDomainRequestKey';

