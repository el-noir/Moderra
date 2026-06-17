import { Controller, Get, Param, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { ListSubmissionsQueryDto } from './dto/list-submissions.query.dto';
import { SubmissionResponseDto } from './dto/submission-response.dto';
import { SubmissionFilesInterceptor } from './interceptors/submission-files.interceptor';
import { SubmissionsService } from './submissions.service';

type AuthenticatedRequest = { user: AuthenticatedUser };

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @UseInterceptors(SubmissionFilesInterceptor())
  createSubmission(
    @Req() request: AuthenticatedRequest,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<SubmissionResponseDto> {
    return this.submissionsService.createSubmission(request.user, files);
  }

  @Get()
  listSubmissions(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListSubmissionsQueryDto,
  ): Promise<SubmissionResponseDto[]> {
    return this.submissionsService.listSubmissions(request.user, query);
  }

  @Get(':id')
  getSubmission(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ): Promise<SubmissionResponseDto> {
    return this.submissionsService.getSubmissionById(id, request.user);
  }
}
