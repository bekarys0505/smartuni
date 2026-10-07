import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { ProgressService } from './progress.service';
import { StudentCalendarService } from './student-calendar.service';

@Module({
  imports: [AuthModule],
  controllers: [StudentController],
  providers: [StudentService, ProgressService, StudentCalendarService],
  exports: [StudentService, ProgressService, StudentCalendarService],
})
export class StudentModule {}