import { useCallback, useMemo, useState } from 'react';
import { z } from 'zod';

export type FieldErrors<T> = Partial<Record<keyof T, string>> & Record<string, string | undefined>;

export function useZodForm<T extends Record<string, unknown>>(schema: z.ZodType<T>, initial: T) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<FieldErrors<T>>({});

  const validate = useCallback(
    (data: T): { success: true; data: T } | { success: false; errors: FieldErrors<T> } => {
      const parsed = schema.safeParse(data);
      if (parsed.success) return { success: true, data: parsed.data };
      const base: Record<string, string | undefined> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        base[key] = issue.message;
      }
      return { success: false, errors: base as FieldErrors<T> };
    },
    [schema],
  );

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [String(key)]: undefined }));
  }, []);

  const handleSubmit = useCallback(
    (onValid: (data: T) => void) => (e: React.FormEvent) => {
      e.preventDefault();
      const res = validate(values);
      if (res.success) {
        setErrors({});
        onValid(res.data);
      } else {
        setErrors(res.errors);
      }
    },
    [validate, values],
  );

  return useMemo(
    () => ({ values, errors, setField, setValues, setErrors, validate, handleSubmit }),
    [values, errors, setField, validate, handleSubmit],
  );
}
