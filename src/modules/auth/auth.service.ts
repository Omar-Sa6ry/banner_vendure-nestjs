import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { UserService } from '../users/users.service'
import { GenerateToken } from '../../common/config/jwt.service'
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
import {
  EmailIsWrong,
  EmailUsed,
  EndOfEmail,
  InvalidToken,
  IsnotAdmin,
  IsnotManager,
  OldPasswordENewPassword,
  SamePassword,
} from 'src/common/constant/messages.constant'
import { AuthInput } from './input/Auth.input'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'

@Injectable()
export class AuthService {
  constructor (
    private userService: UserService,
    private generateToken: GenerateToken,
    private readonly redisService: RedisService,
    private readonly uploadService: UploadService,
    private readonly sendEmailService: SendEmailService,
    @InjectModel(User) private userRepo: typeof User,
  ) {}

  async register (
    fcmToken: string,
    createUserDto: CreateUserDto,
    avatar?: CreateImagDto,
  ): Promise<AuthInput> {
    const { userName, phone, email } = createUserDto
    if (!email.endsWith('@gmail.com')) {
      throw new BadRequestException(EndOfEmail)
    }

    const existedEmail = await this.userService.findByEmail(email)
    if (existedEmail) {
      throw new BadRequestException(EmailUsed)
    }

    const transaction = await this.userRepo.sequelize.transaction()
    try {
      const user = await this.userRepo.create(
        {
          userName,
          email,
          phone,
          password: await HashPassword(createUserDto.password),
        },
        { transaction },
      )

      if (avatar) {
        const filename = await this.uploadService.uploadImage(avatar)
        if (typeof filename === 'string') {
          user.avatar = filename
        }
      }

      user.fcmToken = fcmToken
      await user.save({ transaction })

      await this.sendEmailService.sendEmail(
        email,
        'Register in App',
        `You registered successfully in the App`,
      )

      const token = await this.generateToken.jwt(user?.email, user?.id)

      await transaction.commit()

      return { user, token }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async login (fcmToken: string, loginDto: LoginDto) {
    const { email, password } = loginDto

    let user = await this.userService.findByEmail(email.toLowerCase())
    if (!(user instanceof User)) {
      throw new NotFoundException(EmailIsWrong)
    }

    await ComparePassword(password, user?.password)
    const token = await this.generateToken.jwt(user?.email, user?.id)
    const userCacheKey = `user:${email}`
    await this.redisService.set(userCacheKey, { user, token })
    user.fcmToken = fcmToken
    await user.save()
    return { user, token }
  }

  async forgotPassword (email: string) {
    const lowerEmail = email.toLowerCase()
    const user = await this.userService.findByEmail(lowerEmail)
    if (!(user instanceof User)) {
      throw new NotFoundException(EmailIsWrong)
    }
    if (user.role !== Role.USER) {
      throw new BadRequestException(IsnotAdmin + ', you cannot edit this user')
    }

    const token = randomBytes(32).toString('hex')
    user.resetToken = token
    user.resetTokenExpiry = new Date(Date.now() + 900000) // 15 minutes
    const link = `http://localhost:3000/grapql/reset-password?token=${token}`
    await user.save()

    await this.sendEmailService.sendEmail(
      lowerEmail,
      'Forgot Password',
      `click here to be able to change your password ${link}`,
    )

    return `${user.userName} ,Message sent successfully for your gmail`
  }

  async resetPassword (resetPassword: ResetPasswordDto) {
    const { password, token } = resetPassword

    const transaction = await this.userRepo.sequelize.transaction()
    try {
      const user = await this.userRepo.findOne({
        where: {
          resetToken: token,
          resetTokenExpiry: { [Op.gt]: new Date() }, // Sequelize equivalent for `MoreThan`
        },
        transaction,
      })

      if (!user) {
        throw new BadRequestException(InvalidToken)
      }

      user.password = await HashPassword(password)
      await user.save({ transaction })

      await transaction.commit()

      return `${user.userName}, your password is updated successfully`
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async changePassword (id: number, changePassword: ChangePasswordDto) {
    const { password, newPassword } = changePassword
    if (password === newPassword) {
      throw new BadRequestException(SamePassword)
    }

    const transaction = await this.userRepo.sequelize.transaction()
    try {
      const user = await this.userService.findById(id)
      if (!user) {
        throw new NotFoundException(EmailIsWrong)
      }

      const isMatch = await ComparePassword(password, user.password)
      if (!isMatch) {
        throw new BadRequestException(OldPasswordENewPassword)
      }

      user.password = await HashPassword(newPassword)
      await user.save({ transaction })

      await transaction.commit()

      return `${user.userName}, your password is updated successfully`
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async adminLogin (loginDto: LoginDto) {
    const { email, password } = loginDto

    let user = await this.userService.findByEmail(email.toLowerCase())
    if (!(user instanceof User)) {
      throw new NotFoundException(EmailIsWrong)
    }

    if (user.role !== (Role.ADMIN || Role.MANAGER)) {
      throw new UnauthorizedException(IsnotAdmin)
    }
    await ComparePassword(password, user?.password)
    const token = await this.generateToken.jwt(user?.email, user?.id)
    const userCacheKey = `user:${email}`
    await this.redisService.set(userCacheKey, { user, token })

    return { user, token }
  }

  async managerLogin (loginDto: LoginDto) {
    const { email, password } = loginDto

    let user = await this.userService.findByEmail(email.toLowerCase())
    if (!(user instanceof User)) {
      throw new NotFoundException(EmailIsWrong)
    }

    if (user.role === Role.MANAGER) {
      throw new UnauthorizedException(IsnotManager)
    }
    await ComparePassword(password, user?.password)
    const token = await this.generateToken.jwt(user?.email, user?.id)
    const userCacheKey = `user:${email}`
    await this.redisService.set(userCacheKey, { user, token })

    return { user, token }
  }
}
