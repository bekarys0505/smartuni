import { Module } from '@nestjs/common';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentModule } from './student/student.module';
import { TeacherModule } from './teacher/teacher.module';
import { PublicModule } from './public/public.module';
import { FileModule } from './file/file.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    StudentModule,
    TeacherModule,
    PublicModule,
    FileModule,
  ],
})
export class AppModule {}