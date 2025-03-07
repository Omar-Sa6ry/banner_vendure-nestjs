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
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { NotificationService } from 'src/common/queues/notification/notification.service'
import { PostService } from 'src/modules/post/post.service'
import { Limit, Page } from 'src/common/constant/messages.constant'
import { CommentLikeLoader } from '../loaders/commentLike.loader'
import {
  CommentLikeInput,
  CommentLikeInputResponse,
  CommentLikesInputResponse,
} from '../inputs/commentLike.input'

@Injectable()
export class CommentLikeService {
  constructor (
    @InjectModel(Like) private readonly likeRepo: typeof Like,
    @InjectModel(User) private readonly userRepo: typeof User,
    @InjectModel(Comment) private readonly commentRepo: typeof Comment,
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private postService: PostService,
    private readonly commentLikeLoader: CommentLikeLoader,
    private readonly websocketGateway: WebSocketMessageGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async likeCommnt (
    userId: number,
    id: number,
  ): Promise<CommentLikeInputResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    })
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const comment = await this.commentRepo.findOne({ where: { id } })
    if (!comment)
      throw new NotFoundException(await this.i18n.t('comment.NOT_FOUND'))

    const commentLike = await this.likeRepo.findOne({
      where: { userId, commentId: id },
    })
    if (commentLike)
      throw new BadRequestException(await this.i18n.t('likeComment.EXIST'))

    const transaction = await this.likeRepo.sequelize.transaction()

    try {
      const like = await this.likeRepo.create({
        userId,
        commentId: comment.id,
      })
      await like.save()

      const usercomment = await this.userRepo.findOne({
        where: { id: comment.userId },
      })
      if (!user)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const post = (await this.postService.getId(comment.postId))?.data
      if (!post)
        throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))

      const data: CommentLikeInput = {
        ...like.dataValues,
        user: user.dataValues,
        comment: {
          ...comment.dataValues,
          user: usercomment.dataValues,
          post,
        },
      }

      const relationCacheKey = `like:${like.id}`
      await this.redisService.set(relationCacheKey, data)

      this.websocketGateway.broadcast('likeCreated', {
        likeId: like.id,
        userId,
      })

      await transaction.commit()

      this.notificationService.sendNotification(
        usercomment.fcmToken,
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

  async uncommentLike (
    userId: number,
    commentId: number,
  ): Promise<CommentLikeInputResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    })
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const comment = await this.commentRepo.findOne({ where: { id: commentId } })
    if (!comment)
      throw new NotFoundException(await this.i18n.t('comment.NOT_FOUND'))

    const like = await this.likeRepo.findOne({
      where: { commentId, userId },
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

  async usercommentLikes (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<CommentLikesInputResponse> {
    const { rows: data, count: total } = await this.likeRepo.findAndCountAll({
      where: { userId, commentId: { [Op.ne]: null } },
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    })
    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('likeComment.NOT_FOUNDS'))

    const likesIds = data.map(like => like.id)
    const likes = await this.commentLikeLoader.loadMany(likesIds)

    const items: CommentLikeInput[] = data.map((p, index) => {
      const like = likes[index]

      if (!like)
        throw new NotFoundException(this.i18n.t('likeComment.NOT_FOUND'))

      return like
    })

    const result: CommentLikesInputResponse = {
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

  async numcommentLikes (commentId: number): Promise<CommentLikeInputResponse> {
    const { count: total } = await this.likeRepo.findAndCountAll({
      where: { commentId },
    })

    return { data: null, message: `${total}` }
  }
}
