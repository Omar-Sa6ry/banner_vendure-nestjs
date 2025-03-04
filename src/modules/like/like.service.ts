import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Like } from './entity/like.entity '
import { Post } from '../post/entity/post.entity '
import { User } from '../users/entity/user.entity'
import { Comment } from '../comment/entity/comment.entity '
import { NotificationService } from 'src/common/queues/notification/notification.service'
import { InjectModel } from '@nestjs/sequelize'
import { I18nService } from 'nestjs-i18n'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { LikeLoader } from './loader/like.loader'
import { Limit, Page } from 'src/common/constant/messages.constant'
import {
  LikeInput,
  LikeInputResponse,
  LikesInputResponse,
} from './input/like.input'

@Injectable()
export class LikeService {
  constructor (
    @InjectModel(Post) private postRepo: typeof Post,
    @InjectModel(User) private userRepo: typeof User,
    @InjectModel(Like) private likeRepo: typeof Like,
    @InjectModel(Comment) private commentRepo: typeof Comment,
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private readonly likeLoader: LikeLoader,
    private readonly websocketGateway: WebSocketMessageGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async likePost (userId: number, id: number): Promise<LikeInputResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    })
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const post = await this.postRepo.findOne({ where: { id } })
    if (!post) throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))

    const postLike = await this.likeRepo.findOne({
      where: { userId, postId: id },
    })
    if (postLike)
      throw new BadRequestException(await this.i18n.t('like.NOT_FOUND'))

    const transaction = await this.postRepo.sequelize.transaction()

    try {
      const like = await this.likeRepo.create({
        userId,
        postId: post.id,
      })
      await like.save()

      const postComments = await this.commentRepo.findAll({
        where: { postId: post.id },
        limit: 20,
        order: [['createdAt', 'DESC']],
      })

      const userPost = await this.userRepo.findOne({
        where: { id: post.userId },
      })
      if (!user)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const likes = +(await this.numPostLikes(post.id)).message

      const data: LikeInput = {
        id: like.id,
        createdAt: like.createdAt,
        user,
        post: { ...post, likes, user: userPost, comments: postComments },
      }

      const relationCacheKey = `like:${like.id}`
      await this.redisService.set(relationCacheKey, data)

      this.websocketGateway.broadcast('likeCreated', {
        likeId: like.id,
        userId,
      })

      await transaction.commit()

      this.notificationService.sendNotification(
        userPost.fcmToken,
        await this.i18n.t('comment.CREATED'),
        `${user.userName} write a comment`,
      )

      return {
        data,
        statusCode: 201,
        message: await this.i18n.t('user.NOT_FOUND'),
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async unLikePost (userId: number, postId: number): Promise<string> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    })
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const post = await this.postRepo.findOne({ where: { id: postId } })
    if (!post) throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))

    const like = await this.likeRepo.findOne({
      where: { postId, userId },
    })

    if (!like) throw new NotFoundException(await this.i18n.t('like.NOT_FOUND'))

    await like.destroy()
    const relationCacheKey = `like:${like.id}`
    await this.redisService.set(relationCacheKey, null)

    this.websocketGateway.broadcast('likeDeleted', {
      likeId: like.id,
      userId,
    })

    return await this.i18n.t('like.DELETED')
  }

  async numPostLikes (postId: number): Promise<LikeInputResponse> {
    const { rows: data, count: total } = await this.likeRepo.findAndCountAll({
      where: { postId },
    })

    return { data: null, message: `${total}` }
  }

  async userPostLikes (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<LikesInputResponse> {
    const { rows: data, count: total } = await this.likeRepo.findAndCountAll({
      where: { userId },
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    })
    if (data.length === 0) {
      throw new NotFoundException(await this.i18n.t('like.NOT_FOUNDS'))
    }

    const likesIds = data.map(like => like.id)
    const likes = await this.likeLoader.loadMany(likesIds)

    const items: LikeInput[] = data.map((p, index) => {
      const like = likes[index]
      if (!like) throw new NotFoundException(this.i18n.t('like.NOT_FOUND'))

      return like
    })

    const result: LikesInputResponse = {
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
}
