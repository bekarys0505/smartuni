import {
  calculateAdmissionRating,
  calculateFinalScore,
  getGradeLetter,
  getGradeStatus,
  getGpaPoints,
} from './grading.util';

describe('Grading Utilities (grading.util)', () => {
  describe('calculateAdmissionRating (Рұқсат рейтингі: РД)', () => {
    it('should return null if RK1 is null or undefined', () => {
      expect(calculateAdmissionRating(null, 85)).toBeNull();
      expect(calculateAdmissionRating(undefined, 85)).toBeNull();
    });

    it('should return null if RK2 is null or undefined', () => {
      expect(calculateAdmissionRating(85, null)).toBeNull();
      expect(calculateAdmissionRating(85, undefined)).toBeNull();
    });

    it('should return null if both RK1 and RK2 are null or undefined', () => {
      expect(calculateAdmissionRating(null, null)).toBeNull();
      expect(calculateAdmissionRating(undefined, undefined)).toBeNull();
    });

    it('should compute exact average when both RK1 and RK2 are provided', () => {
      expect(calculateAdmissionRating(80, 90)).toBe(85);
      expect(calculateAdmissionRating(70, 75)).toBe(72.5);
    });

    it('should correctly handle boundary scores 0 and 100', () => {
      expect(calculateAdmissionRating(0, 0)).toBe(0);
      expect(calculateAdmissionRating(0, 100)).toBe(50);
      expect(calculateAdmissionRating(100, 100)).toBe(100);
    });

    it('should round result to 1 decimal place', () => {
      expect(calculateAdmissionRating(83, 84)).toBe(83.5);
      expect(calculateAdmissionRating(77, 80)).toBe(78.5);
    });
  });

  describe('calculateFinalScore (Қорытынды балл)', () => {
    it('should return null if any component is missing', () => {
      expect(calculateFinalScore(null, 80, 90)).toBeNull();
      expect(calculateFinalScore(80, null, 90)).toBeNull();
      expect(calculateFinalScore(80, 80, null)).toBeNull();
      expect(calculateFinalScore(undefined, 80, 90)).toBeNull();
      expect(calculateFinalScore(80, undefined, 90)).toBeNull();
      expect(calculateFinalScore(80, 80, undefined)).toBeNull();
      expect(calculateFinalScore(null, null, null)).toBeNull();
    });

    it('should calculate 0.6 * Admission + 0.4 * Session correctly', () => {
      // Admission = (80 + 80) / 2 = 80
      // Final = 0.6 * 80 + 0.4 * 90 = 48 + 36 = 84
      expect(calculateFinalScore(80, 80, 90)).toBe(84);

      // Admission = (70 + 90) / 2 = 80
      // Final = 0.6 * 80 + 0.4 * 60 = 48 + 24 = 72
      expect(calculateFinalScore(70, 90, 60)).toBe(72);
    });

    it('should correctly handle boundary scores 0 and 100', () => {
      expect(calculateFinalScore(0, 0, 0)).toBe(0);
      expect(calculateFinalScore(100, 100, 100)).toBe(100);
      // RK1=100, RK2=100, Session=0 -> 0.6 * 100 + 0.4 * 0 = 60
      expect(calculateFinalScore(100, 100, 0)).toBe(60);
      // RK1=0, RK2=0, Session=100 -> 0.6 * 0 + 0.4 * 100 = 40
      expect(calculateFinalScore(0, 0, 100)).toBe(40);
    });

    it('should round final score to 1 decimal place', () => {
      // RK1=85, RK2=86 -> Admission = 85.5
      // Session=73 -> Final = 0.6 * 85.5 + 0.4 * 73 = 51.3 + 29.2 = 80.5
      expect(calculateFinalScore(85, 86, 73)).toBe(80.5);
    });
  });

  describe('getGradeLetter (Әріптік бағалау және шекаралар)', () => {
    it('should return null if finalScore is null or undefined', () => {
      expect(getGradeLetter(null)).toBeNull();
      expect(getGradeLetter(undefined)).toBeNull();
      expect(getGradeLetter(null, 70)).toBeNull();
    });

    it('should map score boundaries to correct letter grades', () => {
      expect(getGradeLetter(100)).toBe('A');
      expect(getGradeLetter(95)).toBe('A');
      expect(getGradeLetter(94.9)).toBe('A-');
      expect(getGradeLetter(90)).toBe('A-');
      expect(getGradeLetter(89.9)).toBe('B+');
      expect(getGradeLetter(85)).toBe('B+');
      expect(getGradeLetter(84.9)).toBe('B');
      expect(getGradeLetter(80)).toBe('B');
      expect(getGradeLetter(79.9)).toBe('B-');
      expect(getGradeLetter(75)).toBe('B-');
      expect(getGradeLetter(74.9)).toBe('C+');
      expect(getGradeLetter(70)).toBe('C+');
      expect(getGradeLetter(69.9)).toBe('C');
      expect(getGradeLetter(65)).toBe('C');
      expect(getGradeLetter(64.9)).toBe('C-');
      expect(getGradeLetter(60)).toBe('C-');
      expect(getGradeLetter(59.9)).toBe('D');
      expect(getGradeLetter(55)).toBe('D');
      expect(getGradeLetter(54)).toBe('D');
      expect(getGradeLetter(50)).toBe('D');
      expect(getGradeLetter(49.9)).toBe('F');
      expect(getGradeLetter(49)).toBe('F');
      expect(getGradeLetter(0)).toBe('F');
    });

    it('should enforce F rule when sessionScore is strictly less than 50', () => {
      // Even if final score is high, failing the exam forces 'F'
      expect(getGradeLetter(85, 49)).toBe('F');
      expect(getGradeLetter(75, 40)).toBe('F');
      expect(getGradeLetter(60, 0)).toBe('F');

      // Passing session exam (>= 50) preserves standard letter grade
      expect(getGradeLetter(85, 50)).toBe('B+');
      expect(getGradeLetter(90, 85)).toBe('A-');
    });

    it('should NOT treat missing (null/undefined) session score as zero', () => {
      // If sessionScore is omitted or null, it should not trigger the session < 50 failure rule
      expect(getGradeLetter(85, null)).toBe('B+');
      expect(getGradeLetter(85, undefined)).toBe('B+');
    });
  });

  describe('getGradeStatus (Академиялық күй)', () => {
    it('should return COMPLETE when all three components are present', () => {
      expect(getGradeStatus(80, 85, 90)).toBe('COMPLETE');
      expect(getGradeStatus(0, 0, 0)).toBe('COMPLETE');
    });

    it('should return INCOMPLETE when only 1 or 2 components are present', () => {
      expect(getGradeStatus(80, null, null)).toBe('INCOMPLETE');
      expect(getGradeStatus(null, 85, null)).toBe('INCOMPLETE');
      expect(getGradeStatus(null, null, 90)).toBe('INCOMPLETE');
      expect(getGradeStatus(80, 85, null)).toBe('INCOMPLETE');
      expect(getGradeStatus(80, null, 90)).toBe('INCOMPLETE');
      expect(getGradeStatus(null, 85, 90)).toBe('INCOMPLETE');
    });

    it('should return NOT_STARTED when all three components are null or undefined', () => {
      expect(getGradeStatus(null, null, null)).toBe('NOT_STARTED');
      expect(getGradeStatus(undefined, undefined, undefined)).toBe('NOT_STARTED');
    });
  });

  describe('getGpaPoints (GPA шкаласы)', () => {
    it('should map letters to correct 4.0 scale points', () => {
      expect(getGpaPoints('A')).toBe(4.0);
      expect(getGpaPoints('A-')).toBe(3.67);
      expect(getGpaPoints('B+')).toBe(3.33);
      expect(getGpaPoints('B')).toBe(3.0);
      expect(getGpaPoints('B-')).toBe(2.67);
      expect(getGpaPoints('C+')).toBe(2.33);
      expect(getGpaPoints('C')).toBe(2.0);
      expect(getGpaPoints('C-')).toBe(1.67);
      expect(getGpaPoints('D')).toBe(1.0);
      expect(getGpaPoints('F')).toBe(0.0);
    });

    it('should return null for invalid or null letters', () => {
      expect(getGpaPoints(null)).toBeNull();
      expect(getGpaPoints(undefined)).toBeNull();
      expect(getGpaPoints('UNKNOWN')).toBeNull();
    });
  });
});

