import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Op } from 'sequelize'
import { User } from '../users/entity/user.entity'
import { Reply } from './entity/reply.entity'
import { InjectModel } from '@nestjs/sequelize'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { RedisService } from 'src/common/redis/redis.service'
import { I18nService } from 'nestjs-i18n'
import { Comment } from '../comment/entity/comment.entity '
import { NotificationService } from 'src/common/queues/notification/notification.service'
import { Post } from '../post/entity/post.entity '
import { Limit, Page } from 'src/common/constant/messages.constant'
import { ReplyLoader } from './loader/reply.loader'
import { UserResponse } from '../users/dtos/UserResponse.dto'
import {
  ReplyInput,
  ReplyInputResponse,
  ReplysInputResponse,
} from './input/reply.input'

@Injectable()
export class ReplyService {
  constructor (
    @InjectModel(Reply) private replyRepo: typeof Reply,
    @InjectModel(User) private userRepo: typeof User,
    @InjectModel(Comment) private commentRepo: typeof Comment,
    @InjectModel(Post) private postRepo: typeof Post,
    private readonly i18n: I18nService,
    private readonly replyLoader: ReplyLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async write (
    userId: number,
    commentId: number,
    content: string,
  ): Promise<ReplyInputResponse> {
    const transaction = await this.replyRepo.sequelize.transaction()
    try {
      const user = (await this.userRepo.findByPk(userId))?.dataValues
      if (!user)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const comment = (await this.commentRepo.findByPk(commentId))?.dataValues
      if (!comment)
        throw new NotFoundException(await this.i18n.t('comment.NOT_FOUND'))

      const reply = await this.replyRepo.create(
        {
          userId,
          content,
          commentId,
        },
        { transaction },
      )

      const data: ReplyInput = {
        ...reply.dataValues,
        user,
        comment,
      }

      const post = (await this.postRepo.findByPk(comment.postId))?.dataValues
      if (!post)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const userPost = (await this.userRepo.findByPk(post.userId))?.dataValues
      if (!userPost)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const relationCacheKey = `reply:${reply.id}`
      await this.redisService.set(relationCacheKey, data)

      this.websocketGateway.broadcast('replyWrite', {
        reply: reply.id,
      })

      this.notificationService.sendNotification(
        userPost.fcmToken,
        await this.i18n.t('reply.CREATED'),
        `${user.userName} write a reply for your comment`,
      )

      await transaction.commit()

      return {
        data,
        statusCode: 201,
        message: await this.i18n.t('reply.CREATED'),
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async getId (id: number): Promise<ReplyInputResponse> {
    const reply = await this.replyRepo.findOne({
      where: {
        id,
      },
    })

    if (!reply)
      throw new NotFoundException(await this.i18n.t('reply.NOT_FOUND'))

    const comment = await this.commentRepo.findOne({
      where: { id: reply.commentId },
    })
    const user = await this.userRepo.findOne({
      where: { id: reply.userId },
    })

    const result: ReplyInputResponse = {
      data: {
        ...reply.dataValues,
        comment: comment.dataValues,
        user: user.dataValues,
      },
    }

    const relationCacheKey = `reply:${reply.id}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getById (
    userId: number,
    commentId: number,
  ): Promise<ReplyInputResponse> {
    const reply = await this.replyRepo.findOne({
      where: {
        userId,
        commentId,
      },
    })

    if (!reply)
      throw new NotFoundException(await this.i18n.t('reply.NOT_FOUND'))

    const comment = await this.commentRepo.findOne({
      where: { id: reply.commentId },
    })
    const user = await this.userRepo.findOne({
      where: { id: reply.userId },
    })

    const result: ReplyInputResponse = {
      data: {
        ...reply.dataValues,
        comment: comment.dataValues,
        user: user.dataValues,
      },
    }

    const relationCacheKey = `reply:${reply.id}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async get (
    userId: number,
    commentId: number,
    content: string,
  ): Promise<ReplyInputResponse> {
    const reply = await this.replyRepo.findOne({
      where: {
        userId,
        content,
        commentId,
      },
    })

    if (!reply)
      throw new NotFoundException(await this.i18n.t('reply.NOT_FOUND'))

    const comment = await this.commentRepo.findOne({
      where: { id: reply.commentId },
    })
    const user = await this.userRepo.findOne({
      where: { id: reply.userId },
    })

    const result: ReplyInputResponse = {
      data: {
        ...reply.dataValues,
        comment,
        user: user.dataValues,
      },
    }

    const relationCacheKey = `reply-comment:${commentId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getCommentPost (
    commentId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<ReplysInputResponse> {
    const { rows: data, count: total } = await this.replyRepo.findAndCountAll({
      where: { commentId },
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('reply.NOT_FOUNDS'))

    const replies = await this.replyLoader.loadMany(
      data.map(reply => reply.userId),
    )

    const items: ReplyInput[] = await Promise.all(
      data.map(async (r, index) => {
        const reply = replies[index]
        if (!reply)
          throw new NotFoundException(await this.i18n.t('reply.NOT_FOUND'))

        return reply
      }),
    )

    const result = { items }

    const relationCacheKey = `reply-comment:${commentId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getAllByIds (commentsId: number[]): Promise<ReplysInputResponse> {
    const data = await this.replyRepo.findAll({
      where: { id: { [Op.in]: commentsId } },
    })

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('reply.NOT_FOUNDS'))

    const replies = await this.replyLoader.loadMany(data.map(reply => reply.id))

    const items: ReplyInput[] = await Promise.all(
      data.map(async (r, index) => {
        const reply = replies[index]
        if (!reply)
          throw new NotFoundException(await this.i18n.t('reply.NOT_FOUND'))

        return reply
      }),
    )

    return { items }
  }

  async getCountCommentPost (commentId: number): Promise<ReplyInputResponse> {
    const comment = await (
      await this.commentRepo.findByPk(commentId)
    )?.dataValues
    if (!comment)
      throw new NotFoundException(await this.i18n.t('comment.NOT_FOUND'))

    const { count: total } = await this.replyRepo.findAndCountAll({
      where: { commentId },
    })

    return { message: `${total}`, data: null }
  }

  async getCommentUser (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<ReplysInputResponse> {
    const user = (await this.userRepo.findByPk(userId))?.dataValues
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const { rows: data, count: total } = await this.replyRepo.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('reply.NOT_FOUNDS'))

    const replies = await this.replyLoader.loadMany(
      data.map(reply => reply.userId),
    )

    const items: ReplyInput[] = await Promise.all(
      data.map(async (r, index) => {
        const reply = replies[index]
        if (!reply)
          throw new NotFoundException(await this.i18n.t('reply.NOT_FOUND'))

        return reply
      }),
    )

    const result = { items }

    const relationCacheKey = `reply-user:${userId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getLastComment (
    userId: number,
    commentId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<ReplysInputResponse> {
    const user = (await this.userRepo.findByPk(userId))?.dataValues
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const comment = (await this.commentRepo.findByPk(commentId))?.dataValues
    if (!comment)
      throw new NotFoundException(await this.i18n.t('comment.NOT_FOUND'))

    const { rows: data, count: total } = await this.replyRepo.findAndCountAll({
      where: { commentId, userId },
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('reply.NOT_FOUNDS'))

    const replies = await this.replyLoader.loadMany(
      data.map(reply => reply.userId),
    )

    const items: ReplyInput[] = await Promise.all(
      data.map(async (r, index) => {
        const reply = replies[index]
        if (!reply)
          throw new NotFoundException(await this.i18n.t('reply.NOT_FOUND'))

        return reply
      }),
    )

    const result = { items }

    const relationCacheKey = `reply-user:${userId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getUserByComment (id: number): Promise<UserResponse> {
    const reply = await this.replyRepo.findOne({ where: { id } })
    if (!reply)
      throw new NotFoundException(await this.i18n.t('reply.NOT_FOUND'))

    const user = await (
      await this.userRepo.findOne({ where: { id: reply.userId } })
    )?.dataValues
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const result = { data: user }
    const relationCacheKey = `user:${user.id}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async update (
    userId: number,
    id: number,
    content: string,
  ): Promise<ReplyInputResponse> {
    const transaction = await this.replyRepo.sequelize.transaction()
    try {
      const user = (await this.userRepo.findByPk(userId))?.dataValues
      if (!user)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const reply = await this.replyRepo.findOne({
        where: { id, userId },
        transaction,
      })
      if (!reply)
        throw new NotFoundException(await this.i18n.t('reply.NOT_FOUND'))

      reply.content = content
      await reply.save({ transaction })

      const data: ReplyInput = (await this.getById(userId, reply.commentId))
        .data

      const relationCacheKey = `reply:${reply.id}`
      await this.redisService.set(relationCacheKey, data)

      this.websocketGateway.broadcast('replyUpdate', {
        reply: reply.id,
        userId,
      })

      const comment = (
        await this.commentRepo.findByPk(reply.commentId, { transaction })
      )?.dataValues
      if (!comment)
        throw new NotFoundException(await this.i18n.t('comment.NOT_FOUND'))

      const post = (
        await this.postRepo.findByPk(comment.postId, { transaction })
      )?.dataValues
      if (!post)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const userPost = (
        await this.userRepo.findByPk(post.userId, { transaction })
      )?.dataValues
      if (!userPost)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      await transaction.commit()

      this.notificationService.sendNotification(
        userPost.fcmToken,
        await this.i18n.t('reply.CREATED'),
        `${user.userName} write a reply for your comment`,
      )

      return { data, message: await this.i18n.t('reply.UPDATED') }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async delete (userId: number, id: number): Promise<ReplyInputResponse> {
    const reply = await this.replyRepo.findOne({
      where: { id, userId },
    })
    if (!reply)
      throw new NotFoundException(await this.i18n.t('reply.NOT_FOUND'))

    await reply.destroy()

    this.websocketGateway.broadcast('replyDeleted', {
      reply: reply.id,
      userId,
    })

    const relationCacheKey = `reply:${reply.id}`
    await this.redisService.set(relationCacheKey, null)

    return { data: null, message: await this.i18n.t('reply.DELETED') }
  }
}
