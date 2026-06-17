import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { PolicyModule } from './policy/policy.module';
import { RolesGuard } from './common/guards/roles.guard';

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
    AuthModule,
    PolicyModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [RolesGuard],
})
export class AppModule {}
