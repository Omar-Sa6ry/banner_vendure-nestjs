import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql'
import { AuthService } from './auth.service'
import { User } from '../users/entity/user.entity'
import { AuthResponse } from './dtos/AuthRes.dto'
import { CreateUserDto } from './dtos/CreateUserData.dto'
import { LoginDto } from './dtos/Login.dto'
import { ResetPasswordDto } from './dtos/ResetPassword.dto'
import { ChangePasswordDto } from './dtos/ChangePassword.dto'
import { CreateImagDto } from '../../common/upload/dtos/createImage.dto'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { Role } from 'src/common/constant/enum.constant'
import { RedisService } from 'src/common/redis/redis.service'
import { Auth } from 'src/common/decerator/auth.decerator'
import { I18nService } from 'nestjs-i18n'
import { UserResponse } from '../users/dtos/UserResponse.dto'

@Resolver(of => User)
export class AuthResolver {
  constructor (
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private authService: AuthService,
  ) {}

  @Mutation(returns => AuthResponse)
  async register (
    @Args('fcmToken') fcmToken: string,
    @Args('createUserDto') createUserDto: CreateUserDto,
    @Args('avatar', { nullable: true }) avatar?: CreateImagDto,
  ): Promise<AuthResponse> {
    return await this.authService.register(fcmToken, createUserDto, avatar)
  }

  @Mutation(returns => AuthResponse)
  async login (
    @Args('fcmToken') fcmToken: string,
    @Args('loginDto') loginDto: LoginDto,
  ): Promise<AuthResponse> {
    const userCacheKey = `auth:${loginDto.email}`
    const cachedUser = await this.redisService.get(userCacheKey)

    if (cachedUser instanceof AuthResponse) {
      return { ...cachedUser }
    }

    return await this.authService.login(fcmToken, loginDto)
  }

  @Mutation(returns => AuthResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async forgotPassword (
    @CurrentUser() user: CurrentUserDto,
  ): Promise<AuthResponse> {
    return await this.authService.forgotPassword(user.email)
  }

  @Mutation(returns => AuthResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async resetPassword (
    @Args('resetPasswordDto') resetPasswordDto: ResetPasswordDto,
  ): Promise<UserResponse> {
    return await this.authService.resetPassword(resetPasswordDto)
  }

  @Mutation(returns => AuthResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async changePassword (
    @CurrentUser() user: CurrentUserDto,
    @Args('changePasswordDto') changePasswordDto: ChangePasswordDto,
  ): Promise<UserResponse> {
    return await this.authService.changePassword(user?.id, changePasswordDto)
  }

  @Mutation(returns => AuthResponse)
  async adminLogin (
    @Args('fcmToken') fcmToken: string,
    @Args('loginDto') loginDto: LoginDto,
  ): Promise<AuthResponse> {
    const userCacheKey = `auth:${loginDto.email}`
    const cachedUser = await this.redisService.get(userCacheKey)

    if (cachedUser instanceof AuthResponse) {
      return { ...cachedUser }
    }

    return await this.authService.adminLogin(fcmToken, loginDto)
  }

  @Mutation(returns => AuthResponse)
  async partnerLogin (
    @Args('fcmToken') fcmToken: string,
    @Args('loginDto') loginDto: LoginDto,
  ): Promise<AuthResponse> {
    const userCacheKey = `auth:${loginDto.email}`
    const cachedUser = await this.redisService.get(userCacheKey)

    if (cachedUser instanceof AuthResponse) {
      return { ...cachedUser }
    }

    return await this.authService.partnerLogin(fcmToken, loginDto)
  }

  @Mutation(returns => AuthResponse)
  async managerLogin (
    @Args('fcmToken') fcmToken: string,
    @Args('loginDto') loginDto: LoginDto,
  ): Promise<AuthResponse> {
    const userCacheKey = `auth:${loginDto.email}`
    const cachedUser = await this.redisService.get(userCacheKey)

    if (cachedUser instanceof AuthResponse) {
      return { ...cachedUser }
    }

    return await this.authService.managerLogin(fcmToken, loginDto)
  }

  @Mutation(() => Boolean)
  @Auth(Role.ADMIN, Role.MANAGER)
  async logout (@Context('req') req): Promise<boolean> {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) throw new Error(await this.i18n.t('user.NO_TOKEN'))

    return true
  }
}
