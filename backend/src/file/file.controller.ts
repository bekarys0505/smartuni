import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileService } from './file.service';

class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  fileBase64!: string;

  @IsOptional()
  fileSize?: number;
}

@Controller('api')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  async upload(@Body() dto: UploadFileDto) {
    return this.fileService.uploadFile(dto.fileName, dto.fileBase64, dto.fileSize);
  }

  @Get('files/:filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.fileService.getFilePath(filename);
    res.sendFile(filePath);
  }
}
