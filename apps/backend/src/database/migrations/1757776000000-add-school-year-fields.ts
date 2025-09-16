import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSchoolYearFields1757776000000 implements MigrationInterface {
  name = 'AddSchoolYearFields1757776000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student" 
      ADD COLUMN "schoolLevel" character varying CHECK ("schoolLevel" IN ('primary', 'secondary')),
      ADD COLUMN "currentYear" integer CHECK ("currentYear" >= 1 AND "currentYear" <= 7),
      ADD COLUMN "birthDate" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student" 
      DROP COLUMN "schoolLevel",
      DROP COLUMN "currentYear", 
      DROP COLUMN "birthDate"
    `);
  }
}
