
import 'dotenv/config';
import * as bcrypt from 'bcrypt';

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  /*
   * ==========================================
   * 1. UNIVERSITY
   * ==========================================
   */

  const university = await prisma.university.upsert({
    where: {
      name: 'Шоқан Уәлиханов атындағы Көкшетау университеті',
    },
    update: {},
    create: {
      name: 'Шоқан Уәлиханов атындағы Көкшетау университеті',
      shortName: 'ШУ',
    },
  });

  /*
   * ==========================================
   * 2. FACULTY
   * ==========================================
   */

  const faculty = await prisma.faculty.upsert({
    where: {
      universityId_name: {
        universityId: university.id,
        name: 'Ақпараттық-коммуникациялық технологиялар факультеті',
      },
    },
    update: {},
    create: {
      name: 'Ақпараттық-коммуникациялық технологиялар факультеті',
      universityId: university.id,
    },
  });

  /*
   * ==========================================
   * 3. MAJOR
   * ==========================================
   */

  const major = await prisma.major.upsert({
    where: {
      facultyId_name: {
        facultyId: faculty.id,
        name: 'Ақпараттық жүйелер',
      },
    },
    update: {},
    create: {
      name: 'Ақпараттық жүйелер',
      facultyId: faculty.id,
    },
  });

  /*
   * ==========================================
   * 4. TEACHER USER
   * ==========================================
   */

  const teacherPasswordHash = await bcrypt.hash(
    'Teacher123!',
    12,
  );

  const teacherUser = await prisma.user.upsert({
    where: {
      email: 'teacher@smartuni.kz',
    },
    update: {
      fullName: 'Айдар Тест Мұғалім',
      phone: '+77001112233',
      passwordHash: teacherPasswordHash,
      role: 'TEACHER',
      status: 'ACTIVE',
    },
    create: {
      fullName: 'Айдар Тест Мұғалім',
      email: 'teacher@smartuni.kz',
      phone: '+77001112233',
      passwordHash: teacherPasswordHash,
      role: 'TEACHER',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  /*
   * ==========================================
   * 5. TEACHER PROFILE
   * ==========================================
   */

  const teacherProfile = await prisma.teacherProfile.upsert({
    where: {
      userId: teacherUser.id,
    },
    update: {
      universityId: university.id,
      facultyId: faculty.id,
      department: 'Ақпараттық жүйелер кафедрасы',
      position: 'Аға оқытушы',
      experience: 5,
      bio: 'SmartUni демонстрациялық жүйесінің тест мұғалімі.',
      premium: false,
    },
    create: {
      userId: teacherUser.id,
      universityId: university.id,
      facultyId: faculty.id,
      department: 'Ақпараттық жүйелер кафедрасы',
      position: 'Аға оқытушы',
      experience: 5,
      bio: 'SmartUni демонстрациялық жүйесінің тест мұғалімі.',
      premium: false,
    },
  });

  /*
   * ==========================================
   * 6. SUBJECT
   * ==========================================
   */

  const subject = await prisma.subject.upsert({
    where: {
      id: 'smartuni-web-programming-subject',
    },
    update: {
      name: 'Web бағдарламалау',
      code: 'WEB101',
      description:
        'HTML, CSS, JavaScript және заманауи Web технологияларын үйрену пәні.',
    },
    create: {
      id: 'smartuni-web-programming-subject',
      name: 'Web бағдарламалау',
      code: 'WEB101',
      description:
        'HTML, CSS, JavaScript және заманауи Web технологияларын үйрену пәні.',
    },
  });

  /*
   * ==========================================
   * 7. GROUP
   * ==========================================
   */

  const existingGroup = await prisma.group.findFirst({
    where: {
      name: 'IS-23-1',
      subjectId: subject.id,
      teacherId: teacherProfile.id,
    },
  });

  const group =
    existingGroup ??
    (await prisma.group.create({
      data: {
        name: 'IS-23-1',
        subjectId: subject.id,
        teacherId: teacherProfile.id,
        course: 2,
        capacity: 30,
        semester: 1,
        academicYear: '2026-2027',
        lessonDay: 'Дүйсенбі',
        lessonTime: '14:00',
        classroom: '301',
        status: 'ACTIVE',
        createdById: teacherUser.id,
      },
    }));

  /*
   * ==========================================
   * 8. STUDENT USER
   * ==========================================
   */

  const studentPasswordHash = await bcrypt.hash(
    'Student123!',
    12,
  );

  const studentUser = await prisma.user.upsert({
    where: {
      email: 'student@smartuni.kz',
    },
    update: {
      fullName: 'Demo Student',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
    },
    create: {
      fullName: 'Demo Student',
      email: 'student@smartuni.kz',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: false,
    },
  });

  /*
   * ==========================================
   * 9. STUDENT PROFILE
   * ==========================================
   */

  const studentProfile = await prisma.studentProfile.upsert({
    where: {
      userId: studentUser.id,
    },
    update: {
      universityId: university.id,
      facultyId: faculty.id,
      majorId: major.id,
      course: 2,
      premium: false,
    },
    create: {
      userId: studentUser.id,
      universityId: university.id,
      facultyId: faculty.id,
      majorId: major.id,
      course: 2,
      premium: false,
    },
  });

  /*
   * ==========================================
   * 10. STUDENT GROUP MEMBERSHIP
   * ==========================================
   */

  await prisma.groupMembership.upsert({
    where: {
      studentId_groupId: {
        studentId: studentProfile.id,
        groupId: group.id,
      },
    },
    update: {
      status: 'ACTIVE',
      leftAt: null,
    },
    create: {
      studentId: studentProfile.id,
      groupId: group.id,
      status: 'ACTIVE',
    },
  });

  /*
   * ==========================================
   * 11. OUTPUT
   * ==========================================
   */

  console.log('');
  console.log('==========================================');
  console.log('SmartUni seed completed successfully');
  console.log('==========================================');

  console.log('');
  console.log('University:', university.name);
  console.log('Faculty:', faculty.name);
  console.log('Major:', major.name);

  console.log('');
  console.log('Teacher login:');
  console.log('Email:', teacherUser.email);
  console.log('Password: Teacher123!');

  console.log('');
  console.log('Student login:');
  console.log('Email:', studentUser.email);
  console.log('Password: Student123!');

  console.log('');
  console.log('Student:', studentUser.fullName);
  console.log('Subject:', subject.name);
  console.log('Subject code:', subject.code);
  console.log('Group:', group.name);
  console.log('Lesson:', `${group.lessonDay}, ${group.lessonTime}`);
  console.log('Classroom:', group.classroom);

  console.log('');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

