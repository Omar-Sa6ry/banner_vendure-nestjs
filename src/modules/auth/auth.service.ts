import { UserService } from '../users/users.service'
import { GenerateToken } from './jwt/jwt.service'
import { User } from '../users/entity/user.entity'
import { HashPassword } from './utils/hashPassword'
import { randomBytes } from 'crypto'
import { ChangePasswordDto } from './dtos/ChangePassword.dto'
import { ResetPasswordDto } from './dtos/ResetPassword.dto'
import { LoginDto } from './dtos/Login.dto'
import { ComparePassword } from './utils/comparePassword'
import { SendEmailService } from 'src/common/queues/email/sendemail.service'
import { Role } from 'src/common/constant/enum.constant'
import { CreateImagDto } from 'src/common/upload/dtos/createImage.dto'
import { RedisService } from 'src/common/redis/redis.service'
import { CreateUserDto } from './dtos/CreateUserData.dto'
import { UploadService } from '../../common/upload/upload.service'
import { AuthInputResponse } from './input/Auth.input'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { UserInputResponse } from '../users/input/User.input'
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

@Injectable()
export class AuthService {
  constructor (
    private readonly i18n: I18nService,
    private userService: UserService,
    private generateToken: GenerateToken,
    private readonly redisService: RedisService,
    private readonly uploadService: UploadService,
    private readonly sendEmailService: SendEmailService,
    private readonly websocketGateway: WebSocketMessageGateway,
    @InjectModel(User) private userRepo: typeof User,
  ) {}

  async register (
    fcmToken: string,
    createUserDto: CreateUserDto,
    avatar?: CreateImagDto,
  ): Promise<AuthInputResponse> {
    const { email } = createUserDto
    if (!email.endsWith('@gmail.com'))
      throw new BadRequestException(await this.i18n.t('user.END_EMAIL'))

    const transaction = await this.userRepo.sequelize.transaction()
    try {
      const password = await HashPassword(createUserDto.password)
      const user = await this.userRepo.create(
        {
          ...createUserDto,
          password,
        },
        { transaction },
      )
      console.log('koko')

      if (avatar) {
        const filename = await this.uploadService.uploadImage(avatar)
        if (typeof filename === 'string') {
          user.avatar = filename
        }
      }

      user.fcmToken = fcmToken
      await user.save({ transaction })

      const token = await this.generateToken.jwt(user?.email, user?.id)

      await transaction.commit()

      const result: AuthInputResponse = {
        data: { user: user.dataValues, token },
        statusCode: 201,
        message: await this.i18n.t('user.CREATED'),
      }
      console.log('koko', result)

      const relationCacheKey = `user:${user.id}`
      await this.redisService.set(relationCacheKey, user)

      const relationCacheKey2 = `auth:${user.id}`
      await this.redisService.set(relationCacheKey2, result)

      this.websocketGateway.broadcast('userCreated', {
        userId: user.id,
        user,
      })

      this.sendEmailService.sendEmail(
        email,
        'Register in App',
        `You registered successfully in the App`,
      )

      return result
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async login (
    fcmToken: string,
    loginDto: LoginDto,
  ): Promise<AuthInputResponse> {
    const { email, password } = loginDto

    let user = await this.userRepo.findOne({ where: { email } })

    if (!user)
      throw new BadRequestException(await this.i18n.t('user.EMAIL_WRONG'))

    await ComparePassword(password, user?.password)
    const token = await this.generateToken.jwt(user?.email, user?.id)
    const userCacheKey = `user:${email}`
    await this.redisService.set(userCacheKey, { user, token })
    user.fcmToken = fcmToken
    await user.save()

    const result: AuthInputResponse = {
      data: { user: user.dataValues, token },
      statusCode: 201,
      message: await this.i18n.t('user.LOGIN'),
    }

    const relationCacheKey = `user:${user.id}`
    await this.redisService.set(relationCacheKey, user)

    const relationCacheKey2 = `auth:${user.id}`
    await this.redisService.set(relationCacheKey2, result)

    return result
  }

  async forgotPassword (email: string): Promise<AuthInputResponse> {
    const lowerEmail = email.toLowerCase()
    const user = await (await this.userService.findByEmail(lowerEmail))?.data
    if (!(user instanceof User))
      throw new BadRequestException(await this.i18n.t('user.EMAIL_WRONG'))

    if (user.role === Role.MANAGER || user.role === Role.ADMIN)
      throw new BadRequestException(await this.i18n.t('user.NOT_ADMIN'))

    const token = randomBytes(32).toString('hex')
    user.resetToken = token
    user.resetTokenExpiry = new Date(Date.now() + 900000) // 15 minutes
    const link = `http://localhost:3000/grapql/reset-password?token=${token}`
    await user.save()

    this.sendEmailService.sendEmail(
      lowerEmail,
      'Forgot Password',
      `click here to be able to change your password ${link}`,
    )

    return { message: await this.i18n.t('user.SEND_MSG'), data: null }
  }

  async resetPassword (
    resetPassword: ResetPasswordDto,
  ): Promise<UserInputResponse> {
    const { password, token } = resetPassword

    const transaction = await this.userRepo.sequelize.transaction()
    try {
      const user = await this.userRepo.findOne({
        where: {
          resetToken: token,
          resetTokenExpiry: { [Op.gt]: new Date() },
        },
        transaction,
      })

      if (!user)
        throw new BadRequestException(await this.i18n.t('user.NOT_FOUND'))

      user.password = await HashPassword(password)
      await user.save({ transaction })

      const relationCacheKey = `user:${user.id}`
      await this.redisService.set(relationCacheKey, user)

      await transaction.commit()

      return { message: await this.i18n.t('user.UPDATE_PASSWORD'), data: user }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async changePassword (
    id: number,
    changePassword: ChangePasswordDto,
  ): Promise<UserInputResponse> {
    const { password, newPassword } = changePassword
    if (password === newPassword)
      throw new BadRequestException(await this.i18n.t('user.LOGISANE_PASSWORD'))

    const transaction = await this.userRepo.sequelize.transaction()
    try {
      const user = await (await this.userService.findById(id))?.data
      if (!user)
        throw new BadRequestException(await this.i18n.t('user.EMAIL_WRONG'))

      const isMatch = await ComparePassword(password, user.password)
      if (!isMatch)
        throw new BadRequestException(
          await this.i18n.t('user.OLD_IS_EQUAL_NEW'),
        )

      user.password = await HashPassword(newPassword)
      await user.save({ transaction })

      await transaction.commit()

      return { message: await this.i18n.t('user.UPDATE_PASSWORD'), data: user }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async adminLogin (
    fcmToken: string,
    loginDto: LoginDto,
  ): Promise<AuthInputResponse> {
    const { email, password } = loginDto

    let user = await this.userService.findByEmail(email.toLowerCase())
    if (!(user instanceof User))
      throw new BadRequestException(await this.i18n.t('user.EMAIL_WRONG'))

    if (user.role !== Role.ADMIN)
      throw new UnauthorizedException(await this.i18n.t('user.NOT_ADMIN'))

    await ComparePassword(password, user?.password)
    const token = await this.generateToken.jwt(user?.email, user?.id)
    const userCacheKey = `user:${email}`
    await this.redisService.set(userCacheKey, { user, token })
    user.fcmToken = fcmToken
    await user.save()

    const result: AuthInputResponse = {
      data: { user, token },
      statusCode: 201,
      message: await this.i18n.t('user.LOGIN'),
    }

    const relationCacheKey = `user:${user.id}`
    await this.redisService.set(relationCacheKey, user)

    const relationCacheKey2 = `auth:${user.id}`
    await this.redisService.set(relationCacheKey2, result)

    return result
  }

  async partnerLogin (
    fcmToken: string,
    loginDto: LoginDto,
  ): Promise<AuthInputResponse> {
    const { email, password } = loginDto

    let user = await this.userService.findByEmail(email.toLowerCase())
    if (!(user instanceof User))
      throw new BadRequestException(await this.i18n.t('user.EMAIL_WRONG'))

    if (user.role !== Role.PARTNER)
      throw new UnauthorizedException(await this.i18n.t('user.NOT_ADMIN'))

    await ComparePassword(password, user?.password)
    const token = await this.generateToken.jwt(user?.email, user?.id)
    const userCacheKey = `user:${email}`
    await this.redisService.set(userCacheKey, { user, token })
    user.fcmToken = fcmToken
    await user.save()

    const result: AuthInputResponse = {
      data: { user, token },
      statusCode: 201,
      message: await this.i18n.t('user.LOGIN'),
    }

    const relationCacheKey = `user:${user.id}`
    await this.redisService.set(relationCacheKey, user)

    const relationCacheKey2 = `auth:${user.id}`
    await this.redisService.set(relationCacheKey2, result)

    return result
  }

  async managerLogin (
    fcmToken: string,
    loginDto: LoginDto,
  ): Promise<AuthInputResponse> {
    const { email, password } = loginDto

    let user = await this.userService.findByEmail(email.toLowerCase())
    if (!(user instanceof User))
      throw new BadRequestException(await this.i18n.t('user.EMAIL_WRONG'))

    if (user.role !== Role.MANAGER)
      throw new UnauthorizedException(await this.i18n.t('user.NOT_ADMIN'))

    await ComparePassword(password, user?.password)
    const token = await this.generateToken.jwt(user?.email, user?.id)
    const userCacheKey = `user:${email}`
    await this.redisService.set(userCacheKey, { user, token })
    user.fcmToken = fcmToken
    await user.save()

    const result: AuthInputResponse = {
      data: { user, token },
      statusCode: 201,
      message: await this.i18n.t('user.LOGIN'),
    }

    const relationCacheKey = `user:${user.id}`
    await this.redisService.set(relationCacheKey, user)

    const relationCacheKey2 = `auth:${user.id}`
    await this.redisService.set(relationCacheKey2, result)

    return result
  }
}
