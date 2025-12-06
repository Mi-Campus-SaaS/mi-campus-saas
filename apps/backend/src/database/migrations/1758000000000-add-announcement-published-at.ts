import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnnouncementPublishedAt1758000000000 implements MigrationInterface {
  name = 'AddAnnouncementPublishedAt1758000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "announcement" 
      ADD COLUMN "publishedAt" timestamp
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "announcement" 
      DROP COLUMN "publishedAt"
    `);
  }
}
