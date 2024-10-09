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
  return new DataSource({
    type: 'sqlite',
    synchronize: true,
    database: '../../database/' + corporateDatabase + '.sqlite',
  });
}
export const TENANT_CONNECTION = 'TENANT_CONNECTION';export const subDomainRequestKey = 'subDomainRequestKey';

