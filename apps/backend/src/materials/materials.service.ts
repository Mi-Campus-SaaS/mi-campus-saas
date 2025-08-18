import { BadRequestException, Injectable } from '@nestjs/common';
import { sniffMimeFromFile } from '../common/upload.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository, FindOptionsWhere } from 'typeorm';
import { Material } from './entities/material.entity';
import { join } from 'path';
import { ClassEntity } from '../classes/entities/class.entity';
import { PaginationQueryDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly materialsRepo: Repository<Material>,
  ) {}

  async listForClass(classId: string, query?: PaginationQueryDto): Promise<PaginatedResponse<Material>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const where: FindOptionsWhere<Material> = {
      classEntity: { id: classId } as ClassEntity,
      ...(query?.q ? { title: Like(`%${query.q}%`) } : {}),
    };
    const [rows, total] = await this.materialsRepo.findAndCount({
      where,
      order: { createdAt: (query?.sortDir ?? 'desc').toUpperCase() as 'ASC' | 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data: rows, total, page, limit };
  }

  saveUpload(classId: string, title: string, description: string | undefined, file: Express.Multer.File) {
    const sniffed = sniffMimeFromFile(file.path);
    if (sniffed !== 'unknown' && sniffed !== file.mimetype) {
      throw new BadRequestException('File content type does not match declared type');
    }
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const relativePath = join(uploadDir, file.filename);
    const entity = this.materialsRepo.create({
      classEntity: { id: classId } as ClassEntity,
      title,
      description,
      filePath: relativePath,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
    return this.materialsRepo.save(entity);
  }
}
