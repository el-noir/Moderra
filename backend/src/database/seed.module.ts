import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '../config/config.module';
import { PolicyModule } from '../policy/policy.module';
import { UsersModule } from '../users/users.module';
import { SeedService } from './seed.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mongoUri = configService.get<string>('mongoUri');

        if (!mongoUri) {
          throw new Error('MONGO_URI is not configured');
        }

        return { uri: mongoUri };
      },
    }),
    UsersModule,
    PolicyModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
