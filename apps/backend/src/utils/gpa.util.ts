export function calculateGpaFromGrades(grades: Array<{ score: number; maxScore: number }>): number {
  if (!grades.length) return 0;
  const avg = grades.reduce((sum, g) => sum + g.score / g.maxScore, 0) / grades.length;
  return Math.round(avg * 4 * 100) / 100;
}

