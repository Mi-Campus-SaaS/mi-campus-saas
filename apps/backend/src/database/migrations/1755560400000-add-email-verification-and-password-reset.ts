import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerificationAndPasswordReset1755560400000 implements MigrationInterface {
  name = 'AddEmailVerificationAndPasswordReset1755560400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add email verification fields to user table
    await queryRunner.query(`
      ALTER TABLE "user" 
      ADD COLUMN "emailVerified" boolean NOT NULL DEFAULT false,
      ADD COLUMN "emailVerifiedAt" timestamp
    `);

    // Create verification_token table
    await queryRunner.query(`
      CREATE TYPE "public"."verification_token_type_enum" AS ENUM('email_verification', 'password_reset')
    `);

    await queryRunner.query(`
      CREATE TABLE "verification_token" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "deletedAt" timestamp,
        "token" text NOT NULL,
        "type" "public"."verification_token_type_enum" NOT NULL,
        "userId" uuid NOT NULL,
        "expiresAt" timestamp NOT NULL,
        "usedAt" timestamp,
        "usedFromIp" text,
        "usedFromUserAgent" text,
        CONSTRAINT "PK_verification_token_id" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_verification_token_token_type" ON "verification_token" ("token", "type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_verification_token_userId_type" ON "verification_token" ("userId", "type")
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "verification_token" 
      ADD CONSTRAINT "FK_verification_token_userId" 
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "verification_token" DROP CONSTRAINT "FK_verification_token_userId"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_verification_token_userId_type"`);
    await queryRunner.query(`DROP INDEX "IDX_verification_token_token_type"`);

    // Drop verification_token table
    await queryRunner.query(`DROP TABLE "verification_token"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE "public"."verification_token_type_enum"`);

    // Remove email verification fields from user table
    await queryRunner.query(`
      ALTER TABLE "user" 
      DROP COLUMN "emailVerifiedAt",
      DROP COLUMN "emailVerified"
    `);
  }
}
