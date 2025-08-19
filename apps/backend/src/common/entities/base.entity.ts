import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class TimestampedEntity {
  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date | null;

  @DeleteDateColumn({ nullable: true })
  declare deletedAt: Date | null;
}
