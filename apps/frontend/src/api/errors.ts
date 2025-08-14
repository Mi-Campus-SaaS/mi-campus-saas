import { isAxiosError } from 'axios';

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const responseData: unknown = error.response?.data;

    if (typeof responseData === 'object' && responseData !== null) {
      const messageValue = (responseData as { message?: unknown }).message;

      if (typeof messageValue === 'string') {
        return messageValue;
      }
      if (Array.isArray(messageValue)) {
        return messageValue.filter((v) => typeof v === 'string').join(', ');
      }
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error occurred';
}
