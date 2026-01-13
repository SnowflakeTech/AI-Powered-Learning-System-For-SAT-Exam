import { BadRequestException, Controller, Post, Req, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ok } from '../common/api-response';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

function ensureUploadsDir() {
  const dir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function safeExt(originalname: string) {
  const ext = (path.extname(originalname || '') || '').toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return '';
  return ext === '.jpeg' ? '.jpg' : ext;
}

function makeName(originalname: string) {
  const ext = safeExt(originalname);
  if (!ext) return '';
  const rand = Math.random().toString(16).slice(2);
  const ts = Date.now().toString(10);
  return `qimg_${ts}_${rand}${ext}`;
}

@Controller('upload')
export class UploadController {
  @Post('question-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, ensureUploadsDir()),
        filename: (_req, file, cb) => {
          const name = makeName(file?.originalname || '');
          if (!name) return cb(new BadRequestException('File không hợp lệ (png/jpg/webp)'), '');
          cb(null, name);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const mime = (file?.mimetype || '').toLowerCase();
        const okMime = ['image/png', 'image/jpeg', 'image/webp'].includes(mime);
        if (!okMime) return cb(new BadRequestException('Chỉ hỗ trợ PNG/JPG/WEBP'), false);
        cb(null, true);
      },
    }),
  )
  async uploadQuestionImage(@Req() req: any) {
    const f = req.file;
    if (!f?.filename) throw new BadRequestException('Thiếu file');
    const imageUrl = `/uploads/${f.filename}`;
    return ok({ imageUrl });
  }
}
