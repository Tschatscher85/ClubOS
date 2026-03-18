import { Module } from '@nestjs/common';
import { PosteingangController } from './posteingang.controller';
import { PosteingangService } from './posteingang.service';

@Module({
  controllers: [PosteingangController],
  providers: [PosteingangService],
  exports: [PosteingangService],
})
export class PosteingangModule {}
