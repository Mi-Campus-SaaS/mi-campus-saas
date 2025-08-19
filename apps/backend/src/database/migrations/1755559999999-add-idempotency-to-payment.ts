import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIdempotencyToPayment1755559999999 implements MigrationInterface {
  name = 'AddIdempotencyToPayment1755559999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment" ADD COLUMN "idempotencyKey" character varying(128)`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_payment_idempotency" ON "payment" ("idempotencyKey")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_payment_idempotency"`);
    await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "idempotencyKey"`);
  }
}
