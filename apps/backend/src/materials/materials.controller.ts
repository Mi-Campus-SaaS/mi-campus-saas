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
  Query,
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
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { OwnershipGuard } from '../common/ownership.guard';
import { Ownership } from '../common/ownership.decorator';
import { Throttle } from '@nestjs/throttler';
import { StorageService } from '../common/storage/storage.service';
import {
  getAllowedExtensionsFromEnv,
  hasDangerousDoubleExtension,
  isAllowedExtension,
  extensionToMime,
} from '../common/upload.util';

const MATERIALS_LIMIT = Number(process.env.MATERIALS_THROTTLE_LIMIT ?? 20);
const MATERIALS_TTL = Number(process.env.MATERIALS_THROTTLE_TTL_SECONDS ?? 60);

@UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
@Controller('classes/:id/materials')
export class MaterialsController {
  constructor(
    private readonly materialsService: MaterialsService,
    private readonly storage: StorageService,
  ) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @Ownership({ type: 'classParam', key: 'id' })
  @Get()
  list(@Param('id', ParseUUIDPipe) classId: string, @Query() query: PaginationQueryDto) {
    return this.materialsService.listForClass(classId, query);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Ownership({ type: 'classParam', key: 'id' })
  @Post()
  @Throttle({
    default: {
      limit: MATERIALS_LIMIT,
      ttl: MATERIALS_TTL,
    },
  })
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
          // Normalize extension for jpg/jpeg
          const normalizedExt = ext === 'jpeg' ? 'jpg' : ext;
          cb(null, `${unique}.${normalizedExt}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const original = file.originalname || '';
        if (hasDangerousDoubleExtension(original)) {
          return cb(new Error('Invalid filename'), false);
        }
        const allowedExt = getAllowedExtensionsFromEnv();
        if (!isAllowedExtension(original, allowedExt)) {
          return cb(new Error('Invalid file extension'), false);
        }
        // Compare declared mimetype with extension-derived mime when possible
        const ext = (original.split('.').pop() || '').toLowerCase();
        const expectedMime = extensionToMime(ext);
        if (expectedMime && expectedMime !== file.mimetype.toLowerCase()) {
          return cb(new Error('MIME type mismatch'), false);
        }
        return cb(null, true);
      },
      limits: {
        fileSize: parseInt(process.env.MAX_MATERIAL_SIZE_BYTES || String(10 * 1024 * 1024), 10),
        files: 1,
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

  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @Ownership({ type: 'classParam', key: 'id' })
  @Get(':materialId/signed-url')
  async getSignedUrl(
    @Param('id', ParseUUIDPipe) classId: string,
    @Param('materialId', ParseUUIDPipe) materialId: string,
  ) {
    const url = await this.materialsService.getSignedUrlForMaterial(classId, materialId);
    return { url };
  }
}
