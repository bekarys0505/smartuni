import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileService {
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(fileName: string, fileBase64: string, fileSize?: number) {
    if (!fileName || !fileBase64) {
      throw new BadRequestException('Файл атауы мен контенті міндетті');
    }

    const ext = path.extname(fileName).toLowerCase();
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const dangerous = ['.exe', '.bat', '.cmd', '.sh', '.js', '.vbs', '.php', '.msi', '.ps1', '.py', '.scr'];

    if (dangerous.includes(ext) || !allowed.includes(ext)) {
      throw new BadRequestException(
        'Қабылданбайтын файл түрі. Тек PDF, DOC, DOCX, JPG, PNG рұқсат етілген.',
      );
    }

    // Strip data URL scheme if present
    const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException('Файл көлемі 10 МБ-тан аспауы керек.');
    }

    const safeBaseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_\-\u0400-\u04FF]/g, '_');
    const safeUniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${safeBaseName}${ext}`;
    const targetPath = path.join(this.uploadDir, safeUniqueName);

    await fs.promises.writeFile(targetPath, buffer);

    return {
      message: 'Файл сәтті жүктелді',
      url: `/api/files/${safeUniqueName}`,
      fileName,
      fileSize: buffer.length,
    };
  }

  getFilePath(filename: string): string {
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException('Жарамсыз файл атауы');
    }

    const fullPath = path.join(this.uploadDir, filename);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('Файл табылмады');
    }

    return fullPath;
  }
}

