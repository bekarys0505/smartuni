import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async getUniversities() {
    return this.prisma.university.findMany({
      select: {
        id: true,
        name: true,
        shortName: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getFacultiesByUniversity(universityId: string) {
    return this.prisma.faculty.findMany({
      where: { universityId },
      select: {
        id: true,
        name: true,
        universityId: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getMajorsByFaculty(facultyId: string) {
    return this.prisma.major.findMany({
      where: { facultyId },
      select: {
        id: true,
        name: true,
        facultyId: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
