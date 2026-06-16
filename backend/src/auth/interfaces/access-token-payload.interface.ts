import { UserRole } from '../../common/constants/user.constants';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}
