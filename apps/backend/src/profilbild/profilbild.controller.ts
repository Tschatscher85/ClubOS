import {
  Controller,
  Post,
  Get,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Profilbild')
@Controller('profilbild')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfilbildController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Profilbild hochladen' })
  @UseInterceptors(
    FileInterceptor('bild', {
      storage: diskStorage({
        destination: 'uploads',
        filename: (_req, file, cb) => {
          const name = randomBytes(16).toString('hex');
          cb(null, `profil-${name}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(png|jpeg|jpg|webp)$/)) {
          cb(new Error('Nur PNG, JPG und WebP erlaubt.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async hochladen(
    @AktuellerBenutzer('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })],
      }),
    )
    datei: Express.Multer.File,
  ) {
    const bildUrl = `/uploads/${datei.filename}`;

    await this.prisma.profilbild.upsert({
      where: { userId },
      create: { id: randomBytes(12).toString('hex'), userId, bildUrl },
      update: { bildUrl },
    });

    return { bildUrl };
  }

  @Get()
  @ApiOperation({ summary: 'Profilbild abrufen' })
  async abrufen(@AktuellerBenutzer('id') userId: string) {
    const profilbild = await this.prisma.profilbild.findUnique({
      where: { userId },
    });
    return { bildUrl: profilbild?.bildUrl || null };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Profilbild loeschen' })
  async loeschen(@AktuellerBenutzer('id') userId: string) {
    await this.prisma.profilbild.deleteMany({ where: { userId } });
    return { nachricht: 'Profilbild geloescht.' };
  }
}
