import { MigrationInterface, QueryRunner } from 'typeorm';

export class Auto1755899389216 implements MigrationInterface {
  name = 'Auto1755899389216';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "two_factor_auth" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "totpSecret" character varying, "isEnabled" boolean NOT NULL DEFAULT false, "backupCodes" text, "isEnrolled" boolean NOT NULL DEFAULT false, CONSTRAINT "REL_ceebe2fe995d01aeff8cb013f5" UNIQUE ("userId"), CONSTRAINT "PK_ac930594b4dbe3771cf16cd108d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "enrollment" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "enrollment" ADD "updatedAt" TIMESTAMP DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "enrollment" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "teacher" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "class_session" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "class_entity" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "grade" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "attendance" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "gpa_snapshot" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "student" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "parent" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "material" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "fee_invoice" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "payment" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "refresh_token" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(
      `ALTER TABLE "two_factor_auth" ADD CONSTRAINT "FK_ceebe2fe995d01aeff8cb013f53" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "two_factor_auth" DROP CONSTRAINT "FK_ceebe2fe995d01aeff8cb013f53"`);
    await queryRunner.query(`ALTER TABLE "refresh_token" ALTER COLUMN "updatedAt" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "payment" ALTER COLUMN "updatedAt" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "fee_invoice" ALTER COLUMN "updatedAt" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "material" ALTER COLUMN "updatedAt" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "parent" ALTER COLUMN "updatedAt" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "updatedAt" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "student" ALTER COLUMN "updatedAt" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "gpa_snapshot" ALTER COLUMN "updatedAt" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "attendance" ALTER COLUMN "updatedAt" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "grade" ALTER COLUMN "updatedAt" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "class_entity" ALTER COLUMN "updatedAt" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "class_session" ALTER COLUMN "updatedAt" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "teacher" ALTER COLUMN "updatedAt" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "enrollment" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "enrollment" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "enrollment" DROP COLUMN "createdAt"`);
    await queryRunner.query(`DROP TABLE "two_factor_auth"`);
  }
}
