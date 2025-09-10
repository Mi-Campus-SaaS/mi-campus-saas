export type FieldErrorMap = Record<string, string | undefined>;

type MinimalIssue = { path: Array<string | number>; message: string };

export function mapZodIssues(issues: ReadonlyArray<MinimalIssue>): FieldErrorMap {
  const result: FieldErrorMap = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '');
    const message = issue.message;
    if (key) result[key] = message;
  }
  return result;
}
