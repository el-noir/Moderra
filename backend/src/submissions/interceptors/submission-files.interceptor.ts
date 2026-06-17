import {
  CallHandler,
  ExecutionContext,
  Injectable,
  mixin,
  NestInterceptor,
  Type,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  createSubmissionUploadOptions,
  MAX_IMAGES_PER_SUBMISSION,
} from '../config/submission-upload.config';

export function SubmissionFilesInterceptor(): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    private readonly delegate: NestInterceptor;

    constructor(configService: ConfigService) {
      const Interceptor = FilesInterceptor(
        'images',
        MAX_IMAGES_PER_SUBMISSION,
        createSubmissionUploadOptions(configService),
      );
      this.delegate = new Interceptor();
    }

    intercept(context: ExecutionContext, next: CallHandler) {
      return this.delegate.intercept(context, next);
    }
  }

  return mixin(MixinInterceptor);
}
