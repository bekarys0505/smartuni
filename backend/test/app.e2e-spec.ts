import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/public/universities (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/public/universities')
      .expect(200);
  });

  it('/api/files/test.pdf (GET) - unauthenticated access blocked', () => {
    return request(app.getHttpServer())
      .get('/api/files/test.pdf')
      .expect(401);
  });

  it('/api/upload (POST) - unauthenticated upload blocked', () => {
    return request(app.getHttpServer())
      .post('/api/upload')
      .expect(401);
  });

  it('/api/auth/profile (GET) - unauthenticated access blocked', () => {
    return request(app.getHttpServer())
      .get('/api/auth/profile')
      .expect(401);
  });

  it('/api/auth/profile (PATCH) - unauthenticated access blocked', () => {
    return request(app.getHttpServer())
      .patch('/api/auth/profile')
      .send({ fullName: 'Unauthorized Test' })
      .expect(401);
  });

  it('/api/auth/change-password (POST) - unauthenticated change password blocked', () => {
    return request(app.getHttpServer())
      .post('/api/auth/change-password')
      .send({ currentPassword: 'OldPass123', newPassword: 'NewPass123' })
      .expect(401);
  });

  it('/api/admin/dashboard (GET) - unauthenticated access blocked', () => {
    return request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .expect(401);
  });

  it('/api/admin/users (GET) - unauthenticated access blocked', () => {
    return request(app.getHttpServer())
      .get('/api/admin/users')
      .expect(401);
  });

  it('/api/admin/subjects (GET) - unauthenticated access blocked', () => {
    return request(app.getHttpServer())
      .get('/api/admin/subjects')
      .expect(401);
  });

  it('/api/admin/groups (GET) - unauthenticated access blocked', () => {
    return request(app.getHttpServer())
      .get('/api/admin/groups')
      .expect(401);
  });

  it('/api/teacher/groups/test-group/journal (GET) - unauthenticated access blocked', () => {
    return request(app.getHttpServer())
      .get('/api/teacher/groups/test-group/journal')
      .expect(401);
  });

  it('/api/admin/academic/overview (GET) - unauthenticated access blocked', () => {
    return request(app.getHttpServer())
      .get('/api/admin/academic/overview')
      .expect(401);
  });

  it('/api/admin/academic/students (GET) - unauthenticated access blocked', () => {
    return request(app.getHttpServer())
      .get('/api/admin/academic/students')
      .expect(401);
  });

  it('/api/teacher/groups/test-group/grades (GET) - unauthenticated access blocked', () => {
    return request(app.getHttpServer())
      .get('/api/teacher/groups/test-group/grades')
      .expect(401);
  });

  it('/api/teacher/groups/test-group/grades (POST) - unauthenticated save grades blocked', () => {
    return request(app.getHttpServer())
      .post('/api/teacher/groups/test-group/grades')
      .send({ grades: [{ studentId: 'student-1', rk1: 85 }] })
      .expect(401);
  });

  it('/api/student/grades (GET) - unauthenticated access blocked', () => {
    return request(app.getHttpServer())
      .get('/api/student/grades')
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
