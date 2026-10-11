import { GRADES, GRADE_LABELS, SUBJECT_LABELS, cycleOf, subjectsForGrade, productConfig } from "@educationplus/shared";

/** Classes, cycles et matières proposées — utilisé par l'app mobile. */
export async function GET() {
  return Response.json({
    format: productConfig.courseFormat,
    grades: GRADES.map((g) => ({
      code: g,
      label: GRADE_LABELS[g],
      cycle: cycleOf(g),
      subjects: subjectsForGrade(g).map((code) => ({ code, label: SUBJECT_LABELS[code] })),
    })),
  });
}
