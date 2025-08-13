import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadMaterialDto } from './dto/upload-material.dto';
import { OwnershipGuard } from '../common/ownership.guard';
import { Ownership } from '../common/ownership.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
@Controller('classes/:id/materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @Ownership({ type: 'classParam', key: 'id' })
  @Get()
  list(@Param('id', ParseUUIDPipe) classId: string) {
    return this.materialsService.listForClass(classId);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Ownership({ type: 'classParam', key: 'id' })
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = process.env.UPLOAD_DIR || 'uploads';
          const dest = join(process.cwd(), uploadDir);
          if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = (file.originalname.split('.').pop() || '').toLowerCase();
          cb(null, `${unique}.${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = (process.env.ALLOWED_MATERIAL_MIME || 'application/pdf,image/png,image/jpeg,application/zip')
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        const isAllowed = allowed.includes(file.mimetype.toLowerCase());
        if (!isAllowed) return cb(new Error('Invalid file type'), false);
        return cb(null, true);
      },
      limits: {
        fileSize: parseInt(process.env.MAX_MATERIAL_SIZE_BYTES || String(10 * 1024 * 1024), 10),
      },
    }),
  )
  upload(
    @Param('id', ParseUUIDPipe) classId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadMaterialDto,
  ) {
    return this.materialsService.saveUpload(classId, body.title, body.description, file);
  }
}
