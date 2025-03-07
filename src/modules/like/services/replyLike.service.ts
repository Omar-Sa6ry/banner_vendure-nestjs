import {
  BadRequestException,
  NotFoundException,
  Injectable,
} from '@nestjs/common'
import { Op } from 'sequelize'
import { InjectModel } from '@nestjs/sequelize'
import { Like } from '../entity/like.entity '
import { User } from 'src/modules/users/entity/user.entity'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { I18nService } from 'nestjs-i18n'
import { RedisService } from 'src/common/redis/redis.service'
import { Reply } from 'src/modules/reply/entity/reply.entity'
import { ReplyService } from 'src/modules/reply/reply.service'
import { ReplyLikeLoader } from '../loaders/replyLike.loader'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { NotificationService } from 'src/common/queues/notification/notification.service'
import { Limit, Page } from 'src/common/constant/messages.constant'
import {
  ReplyLikeInput,
  ReplyLikeInputResponse,
  ReplyLikesInputResponse,
} from '../inputs/replyLike.input'

@Injectable()
export class ReplyLikeService {
  constructor (
    @InjectModel(Like) private readonly likeRepo: typeof Like,
    @InjectModel(User) private readonly userRepo: typeof User,
    @InjectModel(Comment) private readonly commentRepo: typeof Comment,
    @InjectModel(Reply) private readonly replyRepo: typeof Reply,
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private readonly replyService: ReplyService,
    private readonly replyLoader: ReplyLikeLoader,
    private readonly websocketGateway: WebSocketMessageGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async likeReply (userId: number, id: number): Promise<ReplyLikeInputResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    })
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const reply = await (await this.replyService.getId(id))?.data
    if (!reply)
      throw new NotFoundException(await this.i18n.t('reply.NOT_FOUND'))

    const replyLike = await this.likeRepo.findOne({
      where: { userId, replyId: id },
    })
    if (replyLike)
      throw new BadRequestException(await this.i18n.t('likeReply.EXIST'))

    const transaction = await this.likeRepo.sequelize.transaction()

    try {
      const like = await this.likeRepo.create({
        userId,
        replyId: reply.id,
      })
      await like.save()

      const userComment = await this.userRepo.findOne({
        where: { id: reply.comment.userId },
      })
      if (!userComment)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const data: ReplyLikeInput = {
        ...like.dataValues,
        reply,
        user: user.dataValues,
      }

      const relationCacheKey = `like:${like.id}`
      await this.redisService.set(relationCacheKey, data)

      this.websocketGateway.broadcast('likeCreated', {
        likeId: like.id,
        userId,
      })

      await transaction.commit()

      this.notificationService.sendNotification(
        userComment.fcmToken,
        await this.i18n.t('likeComment.CREATED'),
        `${user.userName} write a comment`,
      )

      return {
        data,
        statusCode: 201,
        message: await this.i18n.t('likeComment.CREATED'),
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async unReplyLike (
    userId: number,
    replyId: number,
  ): Promise<ReplyLikeInputResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    })
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const reply = await this.replyRepo.findOne({ where: { id: replyId } })
    if (!reply)
      throw new NotFoundException(await this.i18n.t('reply.NOT_FOUND'))

    const like = await this.likeRepo.findOne({
      where: { replyId, userId },
    })

    if (!like)
      throw new NotFoundException(await this.i18n.t('likeComment.NOT_FOUND'))

    await like.destroy()
    const relationCacheKey = `like:${like.id}`
    await this.redisService.set(relationCacheKey, null)

    this.websocketGateway.broadcast('likeDeleted', {
      likeId: like.id,
      userId,
    })

    return { message: await this.i18n.t('likeComment.DELETED'), data: null }
  }

  async userReplyLikes (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<ReplyLikesInputResponse> {
    const { rows: data, count: total } = await this.likeRepo.findAndCountAll({
      where: { userId, replyId: { [Op.ne]: null } },
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    })
    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('likeRply.NOT_FOUNDS'))

    const likesIds = data.map(like => like.id)
    const likes = await this.replyLoader.loadMany(likesIds)

    const items: ReplyLikeInput[] = data.map((p, index) => {
      const like = likes[index]

      if (!like)
        throw new NotFoundException(this.i18n.t('likeComment.NOT_FOUND'))

      return like
    })

    const result: ReplyLikesInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }
    const relationCacheKey = `like-user:${userId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async numReplyLikes (replyId: number): Promise<ReplyLikeInputResponse> {
    const { count: total } = await this.likeRepo.findAndCountAll({
      where: { replyId },
    })

    return { data: null, message: `${total}` }
  }
}
