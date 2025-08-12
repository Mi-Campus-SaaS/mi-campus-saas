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
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadMaterialDto } from './dto/upload-material.dto';

@UseGuards(JwtAuthGuard)
@Controller('classes/:id/materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  list(@Param('id', ParseUUIDPipe) classId: string) {
    return this.materialsService.listForClass(classId);
  }

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
