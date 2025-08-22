import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GradesService } from './grades.service';
import { Grade } from './entities/grade.entity';
import { GpaSnapshot } from './entities/gpa-snapshot.entity';
import { Student } from '../students/entities/student.entity';

describe('GradesService GPA snapshots', () => {
  let service: GradesService;
  interface GradesRepoMock {
    find: jest.Mock<Promise<Grade[]>, [object?]>;
  }
  interface SnapshotsRepoMock {
    create: jest.Mock<GpaSnapshot, [Partial<GpaSnapshot>]>;
    save: jest.Mock<Promise<GpaSnapshot>, [GpaSnapshot]>;
    find: jest.Mock<Promise<GpaSnapshot[]>, [object?]>;
  }
  let gradesRepo: GradesRepoMock;
  let snapshotsRepo: SnapshotsRepoMock;

  beforeEach(async () => {
    gradesRepo = {
      find: jest.fn<Promise<Grade[]>, [object?]>(),
    };

    snapshotsRepo = {
      create: jest.fn<GpaSnapshot, [Partial<GpaSnapshot>]>(),
      save: jest.fn<Promise<GpaSnapshot>, [GpaSnapshot]>(),
      find: jest.fn<Promise<GpaSnapshot[]>, [object?]>(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: getRepositoryToken(Grade), useValue: gradesRepo },
        { provide: getRepositoryToken(GpaSnapshot), useValue: snapshotsRepo },
      ],
    }).compile();

    service = moduleRef.get(GradesService);
  });

  it('calculateStudentGpa uses util and repo data', async () => {
    gradesRepo.find.mockResolvedValue([{ score: 80, maxScore: 100 } as Grade, { score: 90, maxScore: 100 } as Grade]);

    const gpa = await service.calculateStudentGpa('s1');
    expect(gpa).toBeCloseTo(3.4, 1);
    expect(gradesRepo.find).toHaveBeenCalledWith({ where: { student: { id: 's1' } as unknown as Student } });
  });

  it('snapshotStudentGpa computes and persists snapshot', async () => {
    gradesRepo.find.mockResolvedValue([{ score: 100, maxScore: 100 } as Grade]);

    const created: Partial<GpaSnapshot> = {};
    snapshotsRepo.create.mockImplementation((payload: Partial<GpaSnapshot>) => {
      Object.assign(created, payload);
      return payload as GpaSnapshot;
    });
    snapshotsRepo.save.mockImplementation(async (s: GpaSnapshot) => ({ ...s, id: 'snap-1' }) as GpaSnapshot);

    const result = await service.snapshotStudentGpa('student-1');
    expect(result.gpa).toBe(4);
    expect(result.student).toEqual({ id: 'student-1' });
    expect(result.computedAt instanceof Date).toBe(true);
    expect(snapshotsRepo.create).toHaveBeenCalled();
    expect(snapshotsRepo.save).toHaveBeenCalled();
  });

  it('listStudentSnapshots delegates to repo ordered by computedAt desc', async () => {
    const rows = [
      { id: 'b', gpa: 3.2, computedAt: new Date('2024-01-02') },
      { id: 'a', gpa: 3.1, computedAt: new Date('2024-01-01') },
    ] as unknown as GpaSnapshot[];
    snapshotsRepo.find.mockResolvedValue(rows);

    const result = await service.listStudentSnapshots('s2');
    expect(result).toBe(rows);
    expect(snapshotsRepo.find).toHaveBeenCalledWith({
      where: { student: { id: 's2' } as unknown as Student },
      order: { computedAt: 'DESC' },
    });
  });
});
