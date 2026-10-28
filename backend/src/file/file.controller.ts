import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { Request, Response } from 'express';
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
  async upload(
    @Req() req: Request & { user?: { sub?: string } },
    @Body() dto: UploadFileDto,
  ) {
    const userId = req.user?.sub;
    return this.fileService.uploadFile(userId, dto.fileName, dto.fileBase64, dto.fileSize);
  }

  @UseGuards(JwtAuthGuard)
  @Get('files/:filename')
  async getFile(
    @Req() req: Request & { user?: { sub?: string } },
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const userId = req.user?.sub;
    const filePath = await this.fileService.authorizeAndGetFilePath(userId, filename);
    res.sendFile(filePath);
  }
}
