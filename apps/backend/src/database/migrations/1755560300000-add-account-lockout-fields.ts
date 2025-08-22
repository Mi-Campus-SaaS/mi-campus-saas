import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountLockoutFields1755560300000 implements MigrationInterface {
  name = 'AddAccountLockoutFields1755560300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" 
      ADD COLUMN "failedLoginAttempts" integer NOT NULL DEFAULT 0,
      ADD COLUMN "lockedUntil" timestamp,
      ADD COLUMN "lastFailedLoginAt" timestamp
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" 
      DROP COLUMN "failedLoginAttempts",
      DROP COLUMN "lockedUntil", 
      DROP COLUMN "lastFailedLoginAt"
    `);
  }
}
