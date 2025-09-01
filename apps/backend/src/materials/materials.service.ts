import { Injectable, NotFoundException } from '@nestjs/common';
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

  async saveUpload(
    classId: string,
    title: string,
    description: string | undefined,
    file: Express.Multer.File,
    uploaderId: string,
  ) {
    const mimeType = sniffMimeFromFile(file.path);
    const material = this.materialsRepo.create({
      classEntity: { id: classId } as ClassEntity,
      uploader: { id: uploaderId },
      title,
      description,
      filePath: file.filename,
      originalName: file.originalname,
      mimeType,
      size: file.size,
    });
    return this.materialsRepo.save(material);
  }

  async getSignedUrlForMaterial(classId: string, materialId: string): Promise<string> {
    const material = await this.materialsRepo.findOne({
      where: { id: materialId, classEntity: { id: classId } as ClassEntity },
    });
    if (!material) throw new NotFoundException('Material not found');
    return this.storage.getSignedUrl(material.filePath);
  }

  async incrementDownloadCount(classId: string, materialId: string) {
    const material = await this.materialsRepo.findOne({
      where: { id: materialId, classEntity: { id: classId } as ClassEntity },
    });
    if (!material) throw new NotFoundException('Material not found');

    material.downloadCount += 1;
    await this.materialsRepo.save(material);

    return {
      filePath: material.filePath,
      originalName: material.originalName,
      mimeType: material.mimeType,
    };
  }

  async getMaterial(classId: string, materialId: string) {
    const material = await this.materialsRepo.findOne({
      where: { id: materialId, classEntity: { id: classId } as ClassEntity },
    });
    if (!material) throw new NotFoundException('Material not found');

    return {
      filePath: material.filePath,
      mimeType: material.mimeType,
    };
  }
}
