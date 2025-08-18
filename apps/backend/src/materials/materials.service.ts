import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { sniffMimeFromFile } from '../common/upload.util';
import { StorageService } from '../common/storage/storage.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository, FindOptionsWhere } from 'typeorm';
import { Material } from './entities/material.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { PaginationQueryDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly materialsRepo: Repository<Material>,
    private readonly storage: StorageService,
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

  async saveUpload(classId: string, title: string, description: string | undefined, file: Express.Multer.File) {
    const sniffed = sniffMimeFromFile(file.path);
    if (sniffed !== 'unknown' && sniffed !== file.mimetype) {
      throw new BadRequestException('File content type does not match declared type');
    }
    // local path used only when not using s3; StorageService handles the mode
    // In s3 mode, persist file to bucket and store key; in local, return key
    const uploaded = await this.storage.uploadFromLocalTemp(file.path, file.filename, file.mimetype);
    const entity = this.materialsRepo.create({
      classEntity: { id: classId } as ClassEntity,
      title,
      description,
      filePath: uploaded.key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
    return this.materialsRepo.save(entity);
  }

  async getSignedUrlForMaterial(classId: string, materialId: string): Promise<string> {
    const material = await this.materialsRepo.findOne({ where: { id: materialId }, relations: { classEntity: true } });
    if (!material || (material.classEntity && material.classEntity.id !== classId)) {
      throw new NotFoundException('Material not found');
    }
    return this.storage.getSignedUrl(material.filePath);
  }
}
