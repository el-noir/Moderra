import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { USER_ROLES } from '../common/constants/user.constants';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import {
  AdminPolicyResponseDto,
  EnabledCategoriesResponseDto,
  PolicyVersionResponseDto,
} from './dto/policy-response.dto';
import { PolicyService } from './policy.service';
import { Types } from 'mongoose';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('policy')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get('categories')
  @UseGuards(JwtAuthGuard)
  getEnabledCategories(): Promise<EnabledCategoriesResponseDto> {
    return this.policyService.getEnabledCategoryNames();
  }
}

@Controller('admin/policy')
export class AdminPolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  getPolicy(): Promise<AdminPolicyResponseDto> {
    return this.policyService.getAdminPolicyView();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  updatePolicy(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdatePolicyDto,
  ): Promise<PolicyVersionResponseDto> {
    return this.policyService.publishNewVersion(
      new Types.ObjectId(request.user.userId),
      dto.categories,
    );
  }
}
