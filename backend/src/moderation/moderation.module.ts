import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { GroqVisionClient } from './groq-vision.client';
import { ModerationService } from './moderation.service';

@Module({
  imports: [ConfigModule],
  providers: [GroqVisionClient, ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
