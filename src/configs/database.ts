import { DataSource, DataSourceOptions } from 'typeorm';
import { configs } from './configs';
import { EncryptedRequest } from 'rox-custody_common-modules/libs/services/secure-communication/entities/encrypted-request.entity';

export const ormConfigs: DataSourceOptions = {
  type: 'mysql',
  synchronize: false,
  supportBigNumbers: true,
  host: configs.DATABASE_HOST,
  username: configs.DATABASE_USER,
  password: configs.DATABASE_PASSWORD,
  database: configs.DATABASE_NAME,
  port: +configs.DATABASE_PORT,
  entities: [
    __dirname + '/../**/*.entity.{js,ts}',
    // Common modules entities
    EncryptedRequest
  ],
  migrations: [`${__dirname}/../**/migrations/*{.ts,.js}`],
  migrationsTableName: 'migrations',
  migrationsRun: true,
  charset: 'utf8mb4',
};

const dataSource = new DataSource(ormConfigs);
export default dataSource;
