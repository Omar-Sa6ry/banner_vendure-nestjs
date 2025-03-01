import {
  EmailIsWrong,
  EmailUsed,
  UserNameUsed,
} from 'src/common/constant/messages.constant'
import { User } from './entity/user.entity'
import { UpdateUserDto } from './dtos/UpdateUser.dto'
import { RedisService } from 'src/common/redis/redis.service'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { UploadService } from '../../common/upload/upload.service'
import { InjectModel } from '@nestjs/sequelize'

@Injectable()
export class UserService {
  constructor (
    private uploadService: UploadService,
    private readonly redisService: RedisService,
    @InjectModel(User) private userRepo: typeof User,  ) {}

  async findById (id: number) {
    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`User with this ${id} not found`)
    }

    const userCacheKey = `user:${user.id}`
    await this.redisService.set(userCacheKey, user)

    return user
  }

  async findByUserName (userName: string) {
    const user = await this.userRepo.findOne({ where: { userName } })
    if (!user) {
      throw new NotFoundException(`User with ${userName} not found`)
    }
    const userCacheKey = `user:${user.userName}`
    await this.redisService.set(userCacheKey, user)
    return user
  }

  async findByEmail (email: string) {
    const user = await this.userRepo.findOne({ where: { email } })
    if (!user) {
      throw new NotFoundException(`User with ${email} not found`)
    }
    const userCacheKey = `user:${user.email}`
    await this.redisService.set(userCacheKey, user)
    return user
  }

async updateUser(updateUserDto: UpdateUserDto, id: number) {
  const transaction = await this.userRepo.sequelize.transaction();

  try {
    const user = await this.userRepo.findOne({ where: { id }, transaction });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepo.findOne({
        where: { email: updateUserDto.email },
        transaction,
      });
      if (existingUser) {
        throw new BadRequestException(EmailUsed);
      }
    }

    if (updateUserDto.userName && updateUserDto.userName !== user.userName) {
      const existingUser = await this.userRepo.findOne({
        where: { userName: updateUserDto.userName },
        transaction,
      });
      if (existingUser) {
        throw new BadRequestException(UserNameUsed);
      }
    }

    Object.assign(user, updateUserDto);

    if (updateUserDto.avatar) {
      const oldPath = user.avatar;
      const filename = await this.uploadService.uploadImage(updateUserDto.avatar);
      if (typeof filename === 'string') {
        user.avatar = filename;

        // ✅ Optional: Delete old avatar (outside transaction for safety)
        // await this.uploadService.deleteImageByPath(oldPath);
      }
    }

    // ✅ Save updated user inside the transaction
    await user.save({ transaction });

    // ✅ Update Redis cache
    const userCacheKey = `user:${user.email}`;
    await this.redisService.set(userCacheKey, user);

    await transaction.commit();
    return user;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}


  // async deleteUser (id: number) {
  //   const user = await this.findById(id)
  //   if (!(user instanceof User)) {
  //     throw new NotFoundException(EmailIsWrong)
  //   }

  //   // await this.uploadService.deleteImageByPath(user.avatar)
  //   await this.userRepo.remove(user)
  //   return `User with email : ${id} deleted Successfully`
  // }

  // async editUserRole (email: string) {
  //   const user = await this.findByEmail(email)
  //   if (!(user instanceof User)) {
  //     throw new NotFoundException(EmailIsWrong)
  //   }

  //   user.role = Role.ADMIN
  //   await this.userRepo.save(user)
  //   return `User with email : ${user.email} updated Successfully`
  // }
}
