import { User } from './entity/user.entity'
import { UpdateUserDto } from './dtos/UpdateUser.dto'
import { RedisService } from 'src/common/redis/redis.service'
import { UploadService } from '../../common/upload/upload.service'
import { InjectModel } from '@nestjs/sequelize'
import { I18nService } from 'nestjs-i18n'
import { Role } from 'src/common/constant/enum.constant'
import { UserInputResponse } from './input/User.input'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

@Injectable()
export class UserService {
  constructor (
    private readonly i18n: I18nService,
    private uploadService: UploadService,
    private readonly redisService: RedisService,
    @InjectModel(User) private userRepo: typeof User,
  ) {}

  async findById (id: number): Promise<UserInputResponse> {
    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))
    }

    const userCacheKey = `user:${user.id}`
    await this.redisService.set(userCacheKey, user)

    return { data: user }
  }

  async findByUserName (userName: string): Promise<UserInputResponse> {
    const user = await this.userRepo.findOne({ where: { userName } })
    if (!user) {
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))
    }
    const userCacheKey = `user:${user.userName}`
    await this.redisService.set(userCacheKey, user)
    return { data: user }
  }

  async findByEmail (email: string): Promise<UserInputResponse> {
    const user = await this.userRepo.findOne({ where: { email } })
    if (!user) {
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))
    }
    const userCacheKey = `user:${user.email}`
    await this.redisService.set(userCacheKey, user)
    return { data: user }
  }

  async update (
    updateUserDto: UpdateUserDto,
    id: number,
  ): Promise<UserInputResponse> {
    const transaction = await this.userRepo.sequelize.transaction()

    try {
      const user = await this.userRepo.findOne({ where: { id }, transaction })
      if (!user) {
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))
      }

      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.userRepo.findOne({
          where: { email: updateUserDto.email },
          transaction,
        })
        if (existingUser)
          throw new BadRequestException(await this.i18n.t('user.EMAIL_USED'))
      }

      if (updateUserDto.userName && updateUserDto.userName !== user.userName) {
        const existingUser = await this.userRepo.findOne({
          where: { userName: updateUserDto.userName },
          transaction,
        })
        if (existingUser)
          throw new BadRequestException(await this.i18n.t('user.USERNAME_USED'))
      }

      Object.assign(user, updateUserDto)

      if (updateUserDto.avatar) {
        const oldPath = user.avatar
        const filename = await this.uploadService.uploadImage(
          updateUserDto.avatar,
        )
        if (typeof filename === 'string') {
          user.avatar = filename

          await this.uploadService.deleteImage(oldPath)
        }
      }

      await user.save({ transaction })

      const userCacheKey = `user:${user.email}`
      await this.redisService.set(userCacheKey, user)

      await transaction.commit()
      return { data: user }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async deleteUser (id: number): Promise<UserInputResponse> {
    const user = await this.findById(id)
    if (!(user instanceof User))
      throw new BadRequestException(await this.i18n.t('user.EMAIL_WRONG'))

    await this.uploadService.deleteImage(user.avatar)
    await user.destroy()
    return await this.i18n.t('user.DELETED')
  }

  async editUserRole (email: string): Promise<UserInputResponse> {
    const user = await this.findByEmail(email)
    if (!(user instanceof User))
      throw new BadRequestException(await this.i18n.t('user.EMAIL_WRONG'))

    user.role = Role.ADMIN
    await user.save()
    return { data: user, message: await this.i18n.t('user.UPDATED') }
  }
}
