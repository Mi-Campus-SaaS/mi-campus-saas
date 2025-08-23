import { Injectable, BadRequestException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { PasswordPolicyService } from '../auth/password-policy.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @Inject(forwardRef(() => PasswordPolicyService))
    private readonly passwordPolicyService: PasswordPolicyService,
  ) {}

  findById(id: string) {
    return this.usersRepo.findOne({ where: { id } });
  }

  findByUsername(username: string) {
    return this.usersRepo.findOne({ where: { username } });
  }

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByUsername(createUserDto.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    if (createUserDto.email) {
      const existingEmail = await this.findByEmail(createUserDto.email);
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    const passwordValidation = this.passwordPolicyService.validatePassword(createUserDto.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors,
      });
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepo.create({
      username: createUserDto.username,
      email: createUserDto.email,
      displayName: createUserDto.displayName,
      passwordHash,
      role: createUserDto.role,
    });

    return this.usersRepo.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.usersRepo.update(id, userData);
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new BadRequestException(`User with id ${id} not found`);
    }
    return updatedUser;
  }
}
