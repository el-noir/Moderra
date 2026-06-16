import { UserRole } from '../../common/constants/user.constants';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}
