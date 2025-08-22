import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PasswordPolicyService } from '../auth/password-policy.service';

describe('UsersService', () => {
  let service: UsersService;
  const repo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const passwordPolicyService = {
    validatePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: PasswordPolicyService, useValue: passwordPolicyService },
      ],
    }).compile();

    service = module.get(UsersService);
    repo.findOne.mockReset();
    repo.create.mockReset();
    repo.save.mockReset();
    passwordPolicyService.validatePassword.mockReset();
  });

  it('findById delegates to repo', async () => {
    const user = { id: 'u1' } as User;
    repo.findOne.mockResolvedValue(user);
    await expect(service.findById('u1')).resolves.toBe(user);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('findByUsername delegates to repo', async () => {
    const user = { id: 'u2', username: 'name' } as User;
    repo.findOne.mockResolvedValue(user);
    await expect(service.findByUsername('name')).resolves.toBe(user);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { username: 'name' } });
  });
});
