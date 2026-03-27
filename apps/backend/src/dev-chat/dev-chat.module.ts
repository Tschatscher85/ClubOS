import { Module } from '@nestjs/common';
import { DevChatController } from './dev-chat.controller';
import { DevChatService } from './dev-chat.service';

@Module({
  controllers: [DevChatController],
  providers: [DevChatService],
})
export class DevChatModule {}
