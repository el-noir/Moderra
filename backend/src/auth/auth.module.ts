import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

function buildJwtOptions(configService: ConfigService): JwtModuleOptions {
  const secret = configService.get<string>('jwtSecret');

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return {
    secret,
    signOptions: {
      expiresIn: configService.get<number>('jwtExpiresInSeconds') ?? 60 * 60 * 24,
    },
  };
}

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => buildJwtOptions(configService),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
