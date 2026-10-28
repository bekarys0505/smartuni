import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AssessmentPeriod, SaveTermGradesDto, StudentGradeInputDto } from './term-grade.dto';

describe('TermGrade DTO Validation (StudentGradeInputDto & SaveTermGradesDto)', () => {
  describe('StudentGradeInputDto', () => {
    it('should validate successfully with valid scores (0..100) and optional note', async () => {
      const dto = plainToInstance(StudentGradeInputDto, {
        studentId: 'student-1',
        rk1: 85,
        rk2: 90,
        session: 95,
        note: 'Жақсы үлгерім',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept valid boundary values 0 and 100', async () => {
      const dtoMin = plainToInstance(StudentGradeInputDto, {
        studentId: 'student-1',
        rk1: 0,
        rk2: 0,
        session: 0,
      });
      const errorsMin = await validate(dtoMin);
      expect(errorsMin.length).toBe(0);

      const dtoMax = plainToInstance(StudentGradeInputDto, {
        studentId: 'student-1',
        rk1: 100,
        rk2: 100,
        session: 100,
      });
      const errorsMax = await validate(dtoMax);
      expect(errorsMax.length).toBe(0);
    });

    it('should accept null or omitted grades for incomplete evaluations', async () => {
      const dto = plainToInstance(StudentGradeInputDto, {
        studentId: 'student-1',
        rk1: 75,
        rk2: null,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject score less than 0 with validation error', async () => {
      const dto = plainToInstance(StudentGradeInputDto, {
        studentId: 'student-1',
        rk1: -1,
        rk2: -5,
        session: -0.1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);

      const fieldsWithErrors = errors.map((e) => e.property);
      expect(fieldsWithErrors).toContain('rk1');
      expect(fieldsWithErrors).toContain('rk2');
      expect(fieldsWithErrors).toContain('session');
    });

    it('should reject score greater than 100 with validation error', async () => {
      const dto = plainToInstance(StudentGradeInputDto, {
        studentId: 'student-1',
        rk1: 101,
        rk2: 150,
        session: 100.5,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);

      const fieldsWithErrors = errors.map((e) => e.property);
      expect(fieldsWithErrors).toContain('rk1');
      expect(fieldsWithErrors).toContain('rk2');
      expect(fieldsWithErrors).toContain('session');
    });

    it('should reject empty or missing studentId', async () => {
      const dto = plainToInstance(StudentGradeInputDto, {
        studentId: '',
        rk1: 80,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('studentId');
    });
  });

  describe('SaveTermGradesDto', () => {
    it('should validate a valid bulk save payload', async () => {
      const payload = {
        period: AssessmentPeriod.RK1,
        grades: [
          { studentId: 'student-1', rk1: 85 },
          { studentId: 'student-2', rk1: 92, note: 'Түсініктеме' },
        ],
      };

      const dto = plainToInstance(SaveTermGradesDto, payload);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should recursively reject invalid grades in the nested array', async () => {
      const payload = {
        period: AssessmentPeriod.ALL,
        grades: [
          { studentId: 'student-1', rk1: 85 },
          { studentId: 'student-2', rk1: 120 }, // Invalid!
        ],
      };

      const dto = plainToInstance(SaveTermGradesDto, payload);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('grades');
    });

    it('should reject invalid AssessmentPeriod enum values', async () => {
      const payload = {
        period: 'INVALID_PERIOD' as any,
        grades: [{ studentId: 'student-1', rk1: 85 }],
      };

      const dto = plainToInstance(SaveTermGradesDto, payload);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('period');
    });
  });
});
