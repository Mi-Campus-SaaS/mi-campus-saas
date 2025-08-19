import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimestampsRefreshToken1755560200001 implements MigrationInterface {
  name = 'AddTimestampsRefreshToken1755560200001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "refresh_token" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "refresh_token" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "refresh_token" DROP COLUMN IF EXISTS "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "refresh_token" DROP COLUMN IF EXISTS "updatedAt"`);
  }
}
