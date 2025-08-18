import { MigrationInterface, QueryRunner } from 'typeorm';

export class Auto1755553408380 implements MigrationInterface {
  name = 'Auto1755553408380';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "audit_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "type" character varying(100) NOT NULL, "requestId" character varying(64), "ip" character varying(64), "actorUserId" character varying(64), "targetUserId" character varying(64), "objectId" character varying(64), "meta" text, CONSTRAINT "PK_910f64d901a5c3e9878f0d4a407" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_224790a18d5f216a1b65057367" ON "audit_events" ("targetUserId") `);
    await queryRunner.query(`CREATE INDEX "IDX_2e65cfff9e135c7c99c9da371b" ON "audit_events" ("actorUserId") `);
    await queryRunner.query(`CREATE INDEX "IDX_46f9873edb2bcfdb1124f071fb" ON "audit_events" ("type") `);
    await queryRunner.query(`CREATE INDEX "IDX_7f51b93a1819ea59b9df7d9855" ON "audit_events" ("createdAt") `);
    await queryRunner.query(
      `CREATE TABLE "teacher" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "userId" uuid, CONSTRAINT "REL_4f596730e16ee49d9b081b5d8e" UNIQUE ("userId"), CONSTRAINT "PK_2f807294148612a9751dacf1026" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "class_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dayOfWeek" integer NOT NULL, "startTime" character varying NOT NULL, "endTime" character varying NOT NULL, "classEntityId" uuid, CONSTRAINT "PK_a3d6e3f59db21b19a3b6eb908d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "class_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subjectName" character varying NOT NULL, "gradeLevel" character varying NOT NULL, "teacherId" uuid, CONSTRAINT "PK_a09a7b405f60ee1c256e4e64ef0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "enrollment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "active" boolean NOT NULL DEFAULT true, "studentId" uuid, "classEntityId" uuid, CONSTRAINT "UQ_enrollment_student_class" UNIQUE ("studentId", "classEntityId"), CONSTRAINT "PK_7e200c699fa93865cdcdd025885" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "grade" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assignmentName" character varying NOT NULL, "score" double precision NOT NULL, "maxScore" double precision NOT NULL, "date" date NOT NULL, "studentId" uuid, "classEntityId" uuid, CONSTRAINT "PK_58c2176c3ae96bf57daebdbcb5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_grade_class" ON "grade" ("classEntityId") `);
    await queryRunner.query(`CREATE INDEX "IDX_grade_student" ON "grade" ("studentId") `);
    await queryRunner.query(
      `CREATE TABLE "attendance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "present" boolean NOT NULL DEFAULT true, "studentId" uuid, "classEntityId" uuid, "sessionId" uuid, CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_attendance_date" ON "attendance" ("date") `);
    await queryRunner.query(
      `CREATE TABLE "gpa_snapshot" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "gpa" double precision NOT NULL, "computedAt" TIMESTAMP NOT NULL, "studentId" uuid, CONSTRAINT "PK_3488800d52d6784311221bd6b14" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "student" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "enrollmentStatus" character varying, "userId" uuid, CONSTRAINT "REL_b35463776b4a11a3df3c30d920" UNIQUE ("userId"), CONSTRAINT "PK_3d8016e1cb58429474a3c041904" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "email" character varying, "displayName" character varying NOT NULL, "passwordHash" character varying NOT NULL, "role" text NOT NULL, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_email" ON "user" ("email") `);
    await queryRunner.query(
      `CREATE TABLE "parent" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "userId" uuid, CONSTRAINT "REL_a51bd21a6e90dbe656ad65cab8" UNIQUE ("userId"), CONSTRAINT "PK_bf93c41ee1ae1649869ebd05617" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "material" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying, "filePath" character varying NOT NULL, "url" character varying, "originalName" character varying, "mimeType" character varying, "size" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "classEntityId" uuid, "uploaderId" uuid, CONSTRAINT "PK_0343d0d577f3effc2054cbaca7f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fee_invoice" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" double precision NOT NULL, "dueDate" date NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "studentId" uuid, CONSTRAINT "PK_626d6dee0507ce86d785090556c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_fee_dueDate" ON "fee_invoice" ("dueDate") `);
    await queryRunner.query(
      `CREATE TABLE "payment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" double precision NOT NULL, "paidAt" TIMESTAMP NOT NULL DEFAULT now(), "reference" character varying, "invoiceId" uuid, CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_payment_reference" ON "payment" ("reference") `);
    await queryRunner.query(
      `CREATE TABLE "refresh_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tokenHash" character varying(64) NOT NULL, "expiresAt" date NOT NULL, "revokedAt" date, "revokedReason" text, "replacedByTokenId" character varying(36), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "createdByIp" character varying(45), "revokedByIp" character varying(45), "userId" uuid, CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_204f27bcee2b705b8230beaf41" ON "refresh_token" ("tokenHash") `);
    await queryRunner.query(
      `CREATE TABLE "announcement" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "publishAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "deletedAt" TIMESTAMP, "authorId" uuid, "classEntityId" uuid, CONSTRAINT "PK_e0ef0550174fd1099a308fd18a0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "parent_children_student" ("parentId" uuid NOT NULL, "studentId" uuid NOT NULL, CONSTRAINT "PK_aee2825b14770b2fbc92bb33a1c" PRIMARY KEY ("parentId", "studentId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_6e77772d0629f90aab3de8be9c" ON "parent_children_student" ("parentId") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_665ddcb98ba56d82546239d798" ON "parent_children_student" ("studentId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher" ADD CONSTRAINT "FK_4f596730e16ee49d9b081b5d8e5" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_session" ADD CONSTRAINT "FK_6a2bdaf9c2484b407a1cbe5b43c" FOREIGN KEY ("classEntityId") REFERENCES "class_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_entity" ADD CONSTRAINT "FK_937c0d8e1bfa38a5ab61525b9e5" FOREIGN KEY ("teacherId") REFERENCES "teacher"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" ADD CONSTRAINT "FK_5ce702e71b98cc1bb37b81e83d8" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" ADD CONSTRAINT "FK_72bcc3654c904e1db4411775176" FOREIGN KEY ("classEntityId") REFERENCES "class_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade" ADD CONSTRAINT "FK_770cab79ce1d111bc05db17cfbd" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade" ADD CONSTRAINT "FK_1616fb0d2af551e3e5d262bf69b" FOREIGN KEY ("classEntityId") REFERENCES "class_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_120e1c6edcec4f8221f467c8039" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_ab971e28022557a119a20d0d64f" FOREIGN KEY ("classEntityId") REFERENCES "class_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_4b3ed2a2a22881087475bc2e597" FOREIGN KEY ("sessionId") REFERENCES "class_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "gpa_snapshot" ADD CONSTRAINT "FK_2e27992bf7f84aedbe335794d74" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD CONSTRAINT "FK_b35463776b4a11a3df3c30d920a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent" ADD CONSTRAINT "FK_a51bd21a6e90dbe656ad65cab89" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" ADD CONSTRAINT "FK_a86d5c31621ac00115196cb4450" FOREIGN KEY ("classEntityId") REFERENCES "class_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" ADD CONSTRAINT "FK_d667db490e25640fc53e96952e9" FOREIGN KEY ("uploaderId") REFERENCES "teacher"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_invoice" ADD CONSTRAINT "FK_10110fc5e3ea43ebc1e4e87de80" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_87223c7f1d4c2ca51cf69927844" FOREIGN KEY ("invoiceId") REFERENCES "fee_invoice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_token" ADD CONSTRAINT "FK_8e913e288156c133999341156ad" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" ADD CONSTRAINT "FK_15ae13897e2eb2c8e9d932b4a41" FOREIGN KEY ("authorId") REFERENCES "teacher"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" ADD CONSTRAINT "FK_df9f2cb04c38f6763020e5c5ff0" FOREIGN KEY ("classEntityId") REFERENCES "class_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_children_student" ADD CONSTRAINT "FK_6e77772d0629f90aab3de8be9c9" FOREIGN KEY ("parentId") REFERENCES "parent"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_children_student" ADD CONSTRAINT "FK_665ddcb98ba56d82546239d7984" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "parent_children_student" DROP CONSTRAINT "FK_665ddcb98ba56d82546239d7984"`);
    await queryRunner.query(`ALTER TABLE "parent_children_student" DROP CONSTRAINT "FK_6e77772d0629f90aab3de8be9c9"`);
    await queryRunner.query(`ALTER TABLE "announcement" DROP CONSTRAINT "FK_df9f2cb04c38f6763020e5c5ff0"`);
    await queryRunner.query(`ALTER TABLE "announcement" DROP CONSTRAINT "FK_15ae13897e2eb2c8e9d932b4a41"`);
    await queryRunner.query(`ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_8e913e288156c133999341156ad"`);
    await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_87223c7f1d4c2ca51cf69927844"`);
    await queryRunner.query(`ALTER TABLE "fee_invoice" DROP CONSTRAINT "FK_10110fc5e3ea43ebc1e4e87de80"`);
    await queryRunner.query(`ALTER TABLE "material" DROP CONSTRAINT "FK_d667db490e25640fc53e96952e9"`);
    await queryRunner.query(`ALTER TABLE "material" DROP CONSTRAINT "FK_a86d5c31621ac00115196cb4450"`);
    await queryRunner.query(`ALTER TABLE "parent" DROP CONSTRAINT "FK_a51bd21a6e90dbe656ad65cab89"`);
    await queryRunner.query(`ALTER TABLE "student" DROP CONSTRAINT "FK_b35463776b4a11a3df3c30d920a"`);
    await queryRunner.query(`ALTER TABLE "gpa_snapshot" DROP CONSTRAINT "FK_2e27992bf7f84aedbe335794d74"`);
    await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_4b3ed2a2a22881087475bc2e597"`);
    await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_ab971e28022557a119a20d0d64f"`);
    await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_120e1c6edcec4f8221f467c8039"`);
    await queryRunner.query(`ALTER TABLE "grade" DROP CONSTRAINT "FK_1616fb0d2af551e3e5d262bf69b"`);
    await queryRunner.query(`ALTER TABLE "grade" DROP CONSTRAINT "FK_770cab79ce1d111bc05db17cfbd"`);
    await queryRunner.query(`ALTER TABLE "enrollment" DROP CONSTRAINT "FK_72bcc3654c904e1db4411775176"`);
    await queryRunner.query(`ALTER TABLE "enrollment" DROP CONSTRAINT "FK_5ce702e71b98cc1bb37b81e83d8"`);
    await queryRunner.query(`ALTER TABLE "class_entity" DROP CONSTRAINT "FK_937c0d8e1bfa38a5ab61525b9e5"`);
    await queryRunner.query(`ALTER TABLE "class_session" DROP CONSTRAINT "FK_6a2bdaf9c2484b407a1cbe5b43c"`);
    await queryRunner.query(`ALTER TABLE "teacher" DROP CONSTRAINT "FK_4f596730e16ee49d9b081b5d8e5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_665ddcb98ba56d82546239d798"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6e77772d0629f90aab3de8be9c"`);
    await queryRunner.query(`DROP TABLE "parent_children_student"`);
    await queryRunner.query(`DROP TABLE "announcement"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_204f27bcee2b705b8230beaf41"`);
    await queryRunner.query(`DROP TABLE "refresh_token"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_payment_reference"`);
    await queryRunner.query(`DROP TABLE "payment"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fee_dueDate"`);
    await queryRunner.query(`DROP TABLE "fee_invoice"`);
    await queryRunner.query(`DROP TABLE "material"`);
    await queryRunner.query(`DROP TABLE "parent"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_user_email"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "student"`);
    await queryRunner.query(`DROP TABLE "gpa_snapshot"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_attendance_date"`);
    await queryRunner.query(`DROP TABLE "attendance"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_grade_student"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_grade_class"`);
    await queryRunner.query(`DROP TABLE "grade"`);
    await queryRunner.query(`DROP TABLE "enrollment"`);
    await queryRunner.query(`DROP TABLE "class_entity"`);
    await queryRunner.query(`DROP TABLE "class_session"`);
    await queryRunner.query(`DROP TABLE "teacher"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7f51b93a1819ea59b9df7d9855"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_46f9873edb2bcfdb1124f071fb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2e65cfff9e135c7c99c9da371b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_224790a18d5f216a1b65057367"`);
    await queryRunner.query(`DROP TABLE "audit_events"`);
  }
}
