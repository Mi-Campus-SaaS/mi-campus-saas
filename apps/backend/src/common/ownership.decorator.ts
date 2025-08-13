import { SetMetadata } from '@nestjs/common';

export const OWNERSHIP_KEY = 'ownership';

export type OwnershipCheck =
  | { type: 'studentParam'; key: string }
  | { type: 'studentQuery'; key: string }
  | { type: 'classParam'; key: string }
  | { type: 'teacherParam'; key: string }
  | { type: 'parentParam'; key: string }
  | { type: 'invoiceIdBody'; key: string };

export const Ownership = (check: OwnershipCheck) => SetMetadata(OWNERSHIP_KEY, check);
