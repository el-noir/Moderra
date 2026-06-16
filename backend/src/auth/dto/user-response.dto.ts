import { Exclude, Expose } from 'class-transformer';
import { UserDocument } from '../../users/schemas/user.schema';
import { UserRole } from '../../common/constants/user.constants';

@Exclude()
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  role: UserRole;

  @Expose()
  createdAt: Date;

  static fromDocument(user: UserDocument): UserResponseDto {
    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
