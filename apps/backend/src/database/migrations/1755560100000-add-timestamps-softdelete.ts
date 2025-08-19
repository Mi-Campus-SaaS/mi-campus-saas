import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimestampsSoftdelete1755560100000 implements MigrationInterface {
  name = 'AddTimestampsSoftdelete1755560100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add createdAt/updatedAt/deletedAt to entities that lacked them
    await queryRunner.query(
      `ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`);

    await queryRunner.query(
      `ALTER TABLE "teacher" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "teacher" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "teacher" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`);

    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`);

    await queryRunner.query(
      `ALTER TABLE "class_entity" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "class_entity" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "class_entity" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`);

    await queryRunner.query(
      `ALTER TABLE "class_session" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "class_session" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "class_session" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`);

    await queryRunner.query(
      `ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`);

    await queryRunner.query(
      `ALTER TABLE "grade" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "grade" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "grade" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`);

    await queryRunner.query(
      `ALTER TABLE "gpa_snapshot" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "gpa_snapshot" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "gpa_snapshot" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`);

    await queryRunner.query(`ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`);

    await queryRunner.query(
      `ALTER TABLE "fee_invoice" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "fee_invoice" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "fee_invoice" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`);

    await queryRunner.query(
      `ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`);

    await queryRunner.query(
      `ALTER TABLE "parent" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "parent" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "parent" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "parent" DROP COLUMN IF EXISTS "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "parent" DROP COLUMN IF EXISTS "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "parent" DROP COLUMN IF EXISTS "createdAt"`);

    await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN IF EXISTS "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN IF EXISTS "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN IF EXISTS "createdAt"`);

    await queryRunner.query(`ALTER TABLE "fee_invoice" DROP COLUMN IF EXISTS "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "fee_invoice" DROP COLUMN IF EXISTS "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "fee_invoice" DROP COLUMN IF EXISTS "createdAt"`);

    await queryRunner.query(`ALTER TABLE "material" DROP COLUMN IF EXISTS "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "material" DROP COLUMN IF EXISTS "updatedAt"`);

    await queryRunner.query(`ALTER TABLE "gpa_snapshot" DROP COLUMN IF EXISTS "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "gpa_snapshot" DROP COLUMN IF EXISTS "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "gpa_snapshot" DROP COLUMN IF EXISTS "createdAt"`);

    await queryRunner.query(`ALTER TABLE "grade" DROP COLUMN IF EXISTS "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "grade" DROP COLUMN IF EXISTS "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "grade" DROP COLUMN IF EXISTS "createdAt"`);

    await queryRunner.query(`ALTER TABLE "attendance" DROP COLUMN IF EXISTS "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "attendance" DROP COLUMN IF EXISTS "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "attendance" DROP COLUMN IF EXISTS "createdAt"`);

    await queryRunner.query(`ALTER TABLE "class_session" DROP COLUMN IF EXISTS "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "class_session" DROP COLUMN IF EXISTS "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "class_session" DROP COLUMN IF EXISTS "createdAt"`);

    await queryRunner.query(`ALTER TABLE "class_entity" DROP COLUMN IF EXISTS "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "class_entity" DROP COLUMN IF EXISTS "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "class_entity" DROP COLUMN IF EXISTS "createdAt"`);

    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "createdAt"`);

    await queryRunner.query(`ALTER TABLE "teacher" DROP COLUMN IF EXISTS "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "teacher" DROP COLUMN IF EXISTS "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "teacher" DROP COLUMN IF EXISTS "createdAt"`);

    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN IF EXISTS "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN IF EXISTS "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN IF EXISTS "createdAt"`);
  }
}
