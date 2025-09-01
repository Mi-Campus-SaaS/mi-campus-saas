import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaterialDownloadCount1755560400000 implements MigrationInterface {
  name = 'AddMaterialDownloadCount1755560400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "material" ADD "downloadCount" integer NOT NULL DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "material" DROP COLUMN "downloadCount"`);
  }
}
