import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { USER_ROLES } from '../common/constants/user.constants';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { GetVerdictsDto } from './dto/get-verdicts.dto';
import { OverrideVerdictDto } from './dto/override-verdict.dto';
import { VerdictsService } from './verdicts.service';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('admin/verdicts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLES.ADMIN)
export class AdminVerdictsController {
  constructor(private readonly verdictsService: VerdictsService) {}

  @Get()
  getVerdicts(@Query() query: GetVerdictsDto) {
    return this.verdictsService.getVerdicts(query);
  }

  @Patch(':id/override')
  overrideVerdict(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: OverrideVerdictDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.verdictsService.overrideVerdict(
      id,
      new Types.ObjectId(req.user.userId),
      dto,
    );
  }
}
