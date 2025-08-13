import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OWNERSHIP_KEY, OwnershipCheck } from './ownership.decorator';
import { UserRole } from './roles.enum';
import { DataSource, In } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Enrollment } from '../classes/entities/enrollment.entity';
import { FeeInvoice } from '../finance/entities/fee.entity';
import { Parent } from '../parents/entities/parent.entity';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const check = this.getOwnershipCheck(context);
    if (!check) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: UserRole; userId?: string } | undefined;
    if (!user?.role) return false;
    if (user.role === UserRole.ADMIN) return true;

    const targetId = this.extractTargetId(check, request);
    if (!targetId) return false;

    const access = await this.buildAccessContext(user);
    return this.enforceByRole(check, targetId, user.role, access);
  }

  private getOwnershipCheck(context: ExecutionContext): OwnershipCheck | undefined {
    return this.reflector.getAllAndOverride<OwnershipCheck>(OWNERSHIP_KEY, [context.getHandler(), context.getClass()]);
  }

  private extractTargetId(check: OwnershipCheck, request: any): string | undefined {
    switch (check.type) {
      case 'studentParam':
        return request.params?.[check.key];
      case 'studentQuery':
        return request.query?.[check.key];
      case 'classParam':
        return request.params?.[check.key];
      case 'teacherParam':
        return request.params?.[check.key];
      case 'invoiceIdBody':
        return request.body?.[check.key];
      default:
        return undefined;
    }
  }

  private async enforceByRole(
    check: OwnershipCheck,
    targetId: string,
    role: UserRole,
    access: AccessContext,
  ): Promise<boolean> {
    if (check.type === 'studentParam' || check.type === 'studentQuery') {
      return this.canAccessStudent(role, targetId, access);
    }
    if (check.type === 'classParam') {
      return this.canAccessClass(role, targetId, access);
    }
    if (check.type === 'invoiceIdBody') {
      return this.canAccessInvoiceByBody(role, targetId, access);
    }
    if (check.type === 'parentParam') {
      return this.canAccessParent(role, targetId, access);
    }
    if (check.type === 'teacherParam') {
      return this.canAccessTeacher(role, targetId, access);
    }
    return false;
  }

  private canAccessStudent(role: UserRole, targetStudentId: string, access: AccessContext): boolean {
    if (role === UserRole.STUDENT) {
      if (!access.studentId) throw new ForbiddenException('Student id not linked to user');
      return access.studentId === targetStudentId;
    }
    if (role === UserRole.PARENT) {
      if (!access.childStudentIds || access.childStudentIds.length === 0)
        throw new ForbiddenException('No linked children');
      return access.childStudentIds.includes(targetStudentId);
    }
    if (role === UserRole.TEACHER) {
      if (!access.permittedStudentIds || access.permittedStudentIds.length === 0)
        throw new ForbiddenException('No assigned students');
      return access.permittedStudentIds.includes(targetStudentId);
    }
    return false;
  }

  private canAccessClass(role: UserRole, targetClassId: string, access: AccessContext): boolean {
    if (role === UserRole.TEACHER) {
      if (!access.permittedClassIds || access.permittedClassIds.length === 0)
        throw new ForbiddenException('No assigned classes');
      return access.permittedClassIds.includes(targetClassId);
    }
    if (role === UserRole.STUDENT || role === UserRole.PARENT) {
      if (!access.enrolledClassIds || access.enrolledClassIds.length === 0)
        throw new ForbiddenException('No enrolled classes');
      return access.enrolledClassIds.includes(targetClassId);
    }
    return false;
  }

  private async canAccessInvoiceByBody(role: UserRole, invoiceId: string, access: AccessContext): Promise<boolean> {
    const repo = this.dataSource.getRepository(FeeInvoice);
    const invoice = await repo.findOne({ where: { id: invoiceId }, relations: { student: true } });
    if (!invoice) throw new ForbiddenException('Invoice not found');
    return this.canAccessStudent(role, invoice.student.id, access);
  }

  private canAccessTeacher(role: UserRole, targetTeacherId: string, access: AccessContext): boolean {
    if (role !== UserRole.TEACHER) return false;
    if (!access.teacherId) throw new ForbiddenException('Teacher id not linked to user');
    return access.teacherId === targetTeacherId;
  }

  private canAccessParent(role: UserRole, targetParentId: string, access: AccessContext): boolean {
    if (role !== UserRole.PARENT) return false;
    if (!access.parentId) throw new ForbiddenException('Parent id not linked to user');
    return access.parentId === targetParentId;
  }

  private async buildAccessContext(user: { role?: UserRole; userId?: string }): Promise<AccessContext> {
    const access: AccessContext = {
      studentId: undefined,
      teacherId: undefined,
      parentId: undefined,
      permittedClassIds: [],
      permittedStudentIds: [],
      enrolledClassIds: [],
      childStudentIds: [],
    };

    if (!user.userId || !user.role) return access;

    if (user.role === UserRole.STUDENT) {
      const student = await this.dataSource.getRepository(Student).findOne({ where: { user: { id: user.userId } } });
      access.studentId = student?.id;
      if (student?.id) {
        const enrollments = await this.dataSource
          .getRepository(Enrollment)
          .find({ where: { student: { id: student.id }, active: true }, relations: { classEntity: true } });
        access.enrolledClassIds = enrollments.map((e) => e.classEntity.id);
      }
    }

    if (user.role === UserRole.TEACHER) {
      const teacher = await this.dataSource.getRepository(Teacher).findOne({ where: { user: { id: user.userId } } });
      access.teacherId = teacher?.id;
      if (teacher?.id) {
        const classes = await this.dataSource
          .getRepository(ClassEntity)
          .find({ where: { teacher: { id: teacher.id } } });
        access.permittedClassIds = classes.map((c) => c.id);
        if (classes.length > 0) {
          const enrollments = await this.dataSource.getRepository(Enrollment).find({
            where: { classEntity: { id: In(classes.map((c) => c.id)) }, active: true },
            relations: { student: true },
          });
          access.permittedStudentIds = enrollments.map((e) => e.student.id);
        }
      }
    }

    if (user.role === UserRole.PARENT) {
      const parent = await this.dataSource
        .getRepository(Parent)
        .findOne({ where: { user: { id: user.userId } }, relations: { children: true } });
      access.parentId = parent?.id;
      access.childStudentIds = (parent?.children ?? []).map((s) => s.id);
    }

    return access;
  }
}

interface AccessContext {
  studentId?: string;
  teacherId?: string;
  parentId?: string;
  permittedClassIds: string[];
  permittedStudentIds: string[];
  enrolledClassIds: string[];
  childStudentIds: string[];
}
