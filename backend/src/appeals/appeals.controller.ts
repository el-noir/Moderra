import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { USER_ROLES } from '../common/constants/user.constants';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { AppealsService } from './appeals.service';
import { AppealResponseDto } from './dto/appeal-response.dto';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { ListAdminAppealsQueryDto } from './dto/list-admin-appeals.query.dto';
import { ResolveAppealDto } from './dto/resolve-appeal.dto';

type AuthenticatedRequest = { user: AuthenticatedUser };

@Controller('appeals')
@UseGuards(JwtAuthGuard)
export class AppealsController {
  constructor(private readonly appealsService: AppealsService) {}

  @Post()
  createAppeal(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateAppealDto,
  ): Promise<AppealResponseDto> {
    return this.appealsService.createAppeal(request.user, dto);
  }

  @Get('me')
  listMyAppeals(
    @Req() request: AuthenticatedRequest,
  ): Promise<AppealResponseDto[]> {
    return this.appealsService.listMyAppeals(request.user);
  }
}

@Controller('admin/appeals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminAppealsController {
  constructor(private readonly appealsService: AppealsService) {}

  @Get()
  @Roles(USER_ROLES.ADMIN)
  listAppeals(
    @Query() query: ListAdminAppealsQueryDto,
  ): Promise<AppealResponseDto[]> {
    return this.appealsService.listAdminAppeals(query);
  }

  @Patch(':id')
  @Roles(USER_ROLES.ADMIN)
  resolveAppeal(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: ResolveAppealDto,
  ): Promise<AppealResponseDto> {
    return this.appealsService.resolveAppeal(request.user, id, dto);
  }
}
