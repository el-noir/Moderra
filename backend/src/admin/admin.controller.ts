import { Controller, Get, UseGuards } from '@nestjs/common';
import { USER_ROLES } from '../common/constants/user.constants';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('test')
  @Roles(USER_ROLES.ADMIN)
  adminTest() {
    return { ok: true };
  }
}
