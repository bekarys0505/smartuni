import { Controller, Get, Param } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('api/public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('universities')
  async getUniversities() {
    return this.publicService.getUniversities();
  }

  @Get('universities/:universityId/faculties')
  async getFacultiesByUniversity(@Param('universityId') universityId: string) {
    return this.publicService.getFacultiesByUniversity(universityId);
  }

  @Get('faculties/:facultyId/majors')
  async getMajorsByFaculty(@Param('facultyId') facultyId: string) {
    return this.publicService.getMajorsByFaculty(facultyId);
  }
}
