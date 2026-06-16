import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { USER_ROLES } from '../common/constants/user.constants';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AccessTokenPayload } from './interfaces/access-token-payload.interface';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: UserResponseDto }> {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.create(
      dto.email,
      passwordHash,
      USER_ROLES.USER,
    );

    return { user: this.toUserResponse(user) };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: UserResponseDto }> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: AccessTokenPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const jwtSecret = this.configService.get<string>('jwtSecret');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: jwtSecret,
      expiresIn: this.configService.get<number>('jwtExpiresInSeconds') ?? 60 * 60 * 24,
    });

    return {
      accessToken,
      user: this.toUserResponse(user),
    };
  }

  private toUserResponse(user: Parameters<typeof UserResponseDto.fromDocument>[0]): UserResponseDto {
    return plainToInstance(UserResponseDto, UserResponseDto.fromDocument(user), {
      excludeExtraneousValues: true,
    });
  }
}
