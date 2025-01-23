import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const databaseConfig: TypeOrmModuleOptions = {
    type: 'sqlite',
    synchronize: true,
    database: '../../database/database.sqlite',
}
