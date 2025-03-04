import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { User } from '../users/entity/user.entity'
import { Follow } from './entity/follow.entity'
import { InjectModel } from '@nestjs/sequelize'
import { I18nService } from 'nestjs-i18n'
import { RedisService } from 'src/common/redis/redis.service'
import { NotificationService } from 'src/common/queues/notification/notification.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { Status, UserStatus } from 'src/common/constant/enum.constant'
import { Limit, Page } from 'src/common/constant/messages.constant'
import { FollowLoader } from './loader/follow.loader'
import {
  FollowInput,
  FollowInputResponse,
  FollowsInputResponse,
} from './input/follow.input'

@Injectable()
export class FollowService {
  constructor (
    private readonly i18n: I18nService,
    private readonly followLoader: FollowLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    private readonly notificationService: NotificationService,
    @InjectModel(Follow) private followRepo: typeof Follow,
    @InjectModel(User) private userRepo: typeof User,
  ) {}

  async follow (
    followerId: number,
    followingId: number,
  ): Promise<FollowInputResponse> {
    const follower = await this.userRepo.findByPk(followerId)
    if (!follower)
      throw new NotFoundException(await this.i18n.t('follow.NOT_FOUNDER'))

    const following = await this.userRepo.findByPk(followingId)
    if (!following)
      throw new NotFoundException(await this.i18n.t('follow.NOT_FOUNDING'))

    const follow = await this.followRepo.findOne({
      where: { followerId, followingId: following.id },
    })

    if (!follow) {
      let status: Status = Status.PENDING
      if (!follow && following.status !== UserStatus.PRIVACY) {
        status = Status.FOLLOW
      }

      const IsFriend = await this.followRepo.findOne({
        where: { followerId: followingId, followingId: followerId },
      })
      if (IsFriend) {
        IsFriend.status = Status.FRIEND
      }

      const relation = await this.followRepo.create({
        followerId,
        followingId,
        status,
      })

      await follow.save()

      const result: FollowInputResponse = {
        statusCode: 201,
        message: await this.i18n.t('follow.CREATED'),
        data: { ...relation, follower, following },
      }

      const relationCacheKey = `follow:${follow.id}`
      await this.redisService.set(relationCacheKey, result)

      this.websocketGateway.broadcast('followCreated', {
        followId: follow.id,
        follow,
      })

      this.notificationService.sendNotification(
        following.fcmToken,
        await this.i18n.t('comment.CREATED'),
        `${follower.userName} follow you`,
      )

      return result
    }

    await follow.destroy()
    const IsFriend = await this.followRepo.findOne({
      where: { followerId: following.id, followingId: followerId },
    })
    if (IsFriend) {
      IsFriend.status = Status.FOLLOW
      await IsFriend.save()
    }

    const result: FollowInputResponse = {
      statusCode: 201,
      data: null,
      message: await this.i18n.t('follow.DELETED'),
    }

    const relationCacheKey = `follow:${follow.id}`
    await this.redisService.set(relationCacheKey, null)

    this.websocketGateway.broadcast('followerdeleted', {
      followId: follow.id,
      follow,
    })

    return result
  }

  async unfollowing (
    userId: number,
    followerId: number,
  ): Promise<FollowInputResponse> {
    const follower = await this.userRepo.findByPk(followerId)
    if (!follower)
      throw new NotFoundException(await this.i18n.t('follow.NOT_FOUNDER'))

    const following = await this.userRepo.findByPk(userId)
    if (!following)
      throw new NotFoundException(await this.i18n.t('follow.NOT_FOUNDING'))

    const follow = await this.followRepo.findOne({
      where: { followerId, followingId: userId },
    })
    if (!follow) {
      throw new BadRequestException(await this.i18n.t('follow.NOT_FOLLOW_YOU'))
    }

    if (follow.status === Status.FRIEND) {
      const isFriend = await this.followRepo.findOne({
        where: { followingId: followerId, followerId: userId },
      })
      if (isFriend) {
        isFriend.status = Status.FOLLOW
        await follow.save()
      }
    }

    await follow.destroy()

    const relationCacheKey = `follow:${follow.id}`
    await this.redisService.set(relationCacheKey, null)

    this.websocketGateway.broadcast('followingdeleted', {
      followId: follow.id,
      follow,
    })

    return { message: await this.i18n.t('follow.DELETED'), data: null }
  }

  async get (
    followerId: number,
    followingId: number,
  ): Promise<FollowInputResponse> {
    const follower = await this.userRepo.findByPk(followerId)
    if (!follower)
      throw new NotFoundException(await this.i18n.t('follow.NOT_FOUNDER'))

    const following = await this.userRepo.findByPk(followingId)
    if (!following)
      throw new NotFoundException(await this.i18n.t('follow.NOT_FOUNDING'))

    const follow = await this.followRepo.findOne({
      where: { followerId, followingId },
    })

    if (!follow)
      throw new NotFoundException(await this.i18n.t('follow.NO_RELATION'))

    return { data: { ...follow, follower, following } }
  }

  async getFollowers (
    followerId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<FollowsInputResponse> {
    const follower = await this.userRepo.findByPk(followerId)
    if (!follower)
      throw new NotFoundException(await this.i18n.t('follow.NOT_FOUNDER'))

    if (follower.status === UserStatus.PRIVACY)
      throw new BadRequestException(await this.i18n.t('follow.PRIVACY'))

    const { rows: data, count: total } = await this.followRepo.findAndCountAll({
      where: { followerId: follower.id },
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })

    const followIds = data.map(follow => follow.id)
    const follows = await this.followLoader.loadMany(followIds)

    const items: FollowInput[] = data.map((i, index) => {
      const follow = follows[index]

      return follow
    })

    const result: FollowsInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    const relationCacheKey = `follower:${followerId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getFollowing (
    followingId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<FollowsInputResponse> {
    const following = await this.userRepo.findByPk(followingId)
    if (!following)
      throw new NotFoundException(await this.i18n.t('follow.NOT_FOUNDER'))

    if (following.status === UserStatus.PRIVACY)
      throw new BadRequestException(await this.i18n.t('follow.PRIVACY'))

    const { rows: data, count: total } = await this.followRepo.findAndCountAll({
      where: { followerId: following.id },
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })

    const followIds = data.map(follow => follow.id)
    const follows = await this.followLoader.loadMany(followIds)

    const items: FollowInput[] = data.map((i, index) => {
      const follow = follows[index]

      return follow
    })

    const result: FollowsInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    const relationCacheKey = `following:${followingId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getFriends (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<FollowsInputResponse> {
    const { rows: data, count: total } = await this.followRepo.findAndCountAll({
      where: { followerId: userId, status: Status.FRIEND },
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })

    const followIds = data.map(follow => follow.id)
    const follows = await this.followLoader.loadMany(followIds)

    const items: FollowInput[] = data.map((i, index) => {
      const follow = follows[index]

      return follow
    })

    const result: FollowsInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    const relationCacheKey = `friend:${userId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async accept (
    followerId: number,
    followingId: number,
    status: boolean,
  ): Promise<FollowInputResponse> {
    const follower = await this.userRepo.findByPk(followerId)
    if (!follower)
      throw new NotFoundException(await this.i18n.t('follow.NOT_FOUNDER'))

    const following = await this.userRepo.findByPk(followingId)
    if (!following)
      throw new NotFoundException(await this.i18n.t('follow.NOT_FOUNDING'))

    const follow = await this.followRepo.findOne({
      where: { followerId, followingId: following.id, status: Status.PENDING },
    })

    if (!follow)
      throw new NotFoundException(await this.i18n.t('follow.REQUEST'))

    if (status) {
      follow.status = Status.FOLLOW
      follow.save()

      const isFriend = await this.followRepo.findOne({
        where: {
          followerId: following.id,
          followingId: followerId,
          status: Status.FOLLOW,
        },
      })

      if (isFriend) {
        isFriend.status = Status.FRIEND
        follow.status = Status.FRIEND
        follow.save()
        isFriend.save()
      }

      this.notificationService.sendNotification(
        follower.fcmToken,
        await this.i18n.t('comment.CREATED'),
        `${following.userName} accept you`,
      )

      return {
        message: await this.i18n.t('follow.ACCEPT'),
        data: { ...follow, follower, following },
      }
    }

    await follow.destroy()
    return { message: await this.i18n.t('follow.REJECT'), data: null }
  }
}
