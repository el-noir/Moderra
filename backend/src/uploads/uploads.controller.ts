import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly configService: ConfigService) {}

  @Get(':filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const uploadDir = this.configService.get<string>(
      'uploadDir',
      path.join(process.cwd(), 'uploads'),
    );
    // Secure against path traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    res.sendFile(filePath);
  }
}
