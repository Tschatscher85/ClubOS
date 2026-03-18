import { Module } from '@nestjs/common';
import { PosteingangController } from './posteingang.controller';
import { PosteingangService } from './posteingang.service';
import { ImapPollerService } from './imap-poller.service';

@Module({
  controllers: [PosteingangController],
  providers: [PosteingangService, ImapPollerService],
  exports: [PosteingangService],
})
export class PosteingangModule {}
