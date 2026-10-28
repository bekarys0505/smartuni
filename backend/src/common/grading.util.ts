export function calculateAdmissionRating(
  rk1: number | null | undefined,
  rk2: number | null | undefined,
): number | null {
  if (rk1 === null || rk1 === undefined || rk2 === null || rk2 === undefined) {
    return null;
  }
  return Math.round(((rk1 + rk2) / 2) * 10) / 10;
}

export function calculateFinalScore(
  rk1: number | null | undefined,
  rk2: number | null | undefined,
  session: number | null | undefined,
): number | null {
  if (
    rk1 === null ||
    rk1 === undefined ||
    rk2 === null ||
    rk2 === undefined ||
    session === null ||
    session === undefined
  ) {
    return null;
  }

  const admission = (rk1 + rk2) / 2;
  const finalScore = 0.6 * admission + 0.4 * session;
  return Math.round(finalScore * 10) / 10;
}

export function getGradeLetter(
  finalScore: number | null | undefined,
  sessionScore?: number | null | undefined,
): string | null {
  if (finalScore === null || finalScore === undefined) {
    return null;
  }

  // If student failed session exam (< 50 in Kazakhstan academic rule), letter is F
  if (sessionScore !== null && sessionScore !== undefined && sessionScore < 50) {
    return 'F';
  }

  if (finalScore >= 95) return 'A';
  if (finalScore >= 90) return 'A-';
  if (finalScore >= 85) return 'B+';
  if (finalScore >= 80) return 'B';
  if (finalScore >= 75) return 'B-';
  if (finalScore >= 70) return 'C+';
  if (finalScore >= 65) return 'C';
  if (finalScore >= 60) return 'C-';
  if (finalScore >= 50) return 'D';
  return 'F';
}

export function getGradeStatus(
  rk1: number | null | undefined,
  rk2: number | null | undefined,
  session: number | null | undefined,
): 'COMPLETE' | 'INCOMPLETE' | 'NOT_STARTED' {
  const hasRk1 = rk1 !== null && rk1 !== undefined;
  const hasRk2 = rk2 !== null && rk2 !== undefined;
  const hasSession = session !== null && session !== undefined;

  if (hasRk1 && hasRk2 && hasSession) {
    return 'COMPLETE';
  }
  if (hasRk1 || hasRk2 || hasSession) {
    return 'INCOMPLETE';
  }
  return 'NOT_STARTED';
}

export function getGpaPoints(letter: string | null | undefined): number | null {
  if (!letter) return null;
  switch (letter) {
    case 'A':
      return 4.0;
    case 'A-':
      return 3.67;
    case 'B+':
      return 3.33;
    case 'B':
      return 3.0;
    case 'B-':
      return 2.67;
    case 'C+':
      return 2.33;
    case 'C':
      return 2.0;
    case 'C-':
      return 1.67;
    case 'D':
      return 1.0;
    case 'F':
      return 0.0;
    default:
      return null;
  }
}
