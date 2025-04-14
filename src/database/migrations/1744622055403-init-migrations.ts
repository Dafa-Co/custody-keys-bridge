import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigrations1744622055403 implements MigrationInterface {
    name = 'InitMigrations1744622055403'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`encrypted_request\` (\`id\` int NOT NULL AUTO_INCREMENT, \`key\` varchar(500) NOT NULL, \`expiredAt\` timestamp NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`backup_storage_active_session\` (\`created_at\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id\` int NOT NULL AUTO_INCREMENT, \`sessionKey\` varchar(300) NOT NULL, \`corporateId\` int NOT NULL, \`backupStorageId\` int NOT NULL, \`expiresAt\` timestamp NULL, INDEX \`IDX_96502006492e21f514ac74d020\` (\`corporateId\`, \`backupStorageId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`backup_storage\` (\`id\` int NOT NULL, \`corporateId\` int NOT NULL, \`url\` varchar(300) NULL, PRIMARY KEY (\`id\`, \`corporateId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`backup_storage_verify_key\` (\`created_at\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`verifyKey\` varchar(300) NOT NULL, \`corporateId\` int NOT NULL, \`backupStorageId\` int NOT NULL, PRIMARY KEY (\`verifyKey\`, \`corporateId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`backup_storage_active_session\` ADD CONSTRAINT \`FK_96502006492e21f514ac74d020b\` FOREIGN KEY (\`backupStorageId\`, \`corporateId\`) REFERENCES \`backup_storage\`(\`id\`,\`corporateId\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`backup_storage_verify_key\` ADD CONSTRAINT \`FK_fb9e8460493e90326ef46c0cdfb\` FOREIGN KEY (\`backupStorageId\`, \`corporateId\`) REFERENCES \`backup_storage\`(\`id\`,\`corporateId\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`backup_storage_verify_key\` DROP FOREIGN KEY \`FK_fb9e8460493e90326ef46c0cdfb\``);
        await queryRunner.query(`ALTER TABLE \`backup_storage_active_session\` DROP FOREIGN KEY \`FK_96502006492e21f514ac74d020b\``);
        await queryRunner.query(`DROP TABLE \`backup_storage_verify_key\``);
        await queryRunner.query(`DROP TABLE \`backup_storage\``);
        await queryRunner.query(`DROP INDEX \`IDX_96502006492e21f514ac74d020\` ON \`backup_storage_active_session\``);
        await queryRunner.query(`DROP TABLE \`backup_storage_active_session\``);
        await queryRunner.query(`DROP TABLE \`encrypted_request\``);
    }

}
