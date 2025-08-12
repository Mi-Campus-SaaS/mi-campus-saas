import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './entities/material.entity';
import { join } from 'path';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly materialsRepo: Repository<Material>,
  ) {}

  listForClass(classId: string) {
    return this.materialsRepo.find({ where: { classEntity: { id: classId } as any } });
  }

  saveUpload(classId: string, title: string, description: string | undefined, file: Express.Multer.File) {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const relativePath = join(uploadDir, file.filename);
    const entity = this.materialsRepo.create({
      classEntity: { id: classId } as any,
      title,
      description,
      filePath: relativePath,
    });
    return this.materialsRepo.save(entity);
  }
}
