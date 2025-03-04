import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Comment } from './entity/comment.entity '
import { User } from '../users/entity/user.entity'
import { Post } from '../post/entity/post.entity '
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { InjectModel } from '@nestjs/sequelize'
import { LikeService } from '../like/like.service'
import { NotificationService } from 'src/common/queues/notification/notification.service'
import { I18nService } from 'nestjs-i18n'
import { RedisService } from 'src/common/redis/redis.service'
import { Limit, Page } from 'src/common/constant/messages.constant'
import { CommentLoader } from './loader/comment.loader'
import {
  CommentInput,
  CommentInputResponse,
  CommentsInputResponse,
} from './input/comment.input'

@Injectable()
export class CommentService {
  constructor (
    @InjectModel(Comment) private commentRepo: typeof Comment,
    @InjectModel(Post) private postRepo: typeof Post,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
    private commentLoader: CommentLoader,
    private readonly likeService: LikeService,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async write (
    userId: number,
    postId: number,
    content: string,
  ): Promise<CommentInputResponse> {
    const transaction = await this.commentRepo.sequelize.transaction()

    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        transaction,
      })
      if (!user) {
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))
      }

      const post = await this.postRepo.findOne({
        where: { id: postId },
        transaction,
      })
      if (!post) {
        throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))
      }

      const comment = await this.commentRepo.create(
        { userId, content, postId },
        { transaction },
      )

      const comments = await this.commentRepo.findAll({
        where: { postId: post.id },
      })
      const likes = +(await this.likeService.numPostLikes(post.id)).message
      await transaction.commit()

      const userPost = await this.userRepo.findByPk(post.userId)

      const data: CommentInput = {
        id: comment.id,
        createdAt: comment.createdAt,
        user,
        content,
        post: {
          ...post,
          user: userPost,
          comments,
          likes,
        },
      }

      this.websocketGateway.broadcast('commentWrite', {
        comment: comment.id,
        userId,
      })

      const relationCacheKey = `comment:${comment.id}`
      await this.redisService.set(relationCacheKey, data)

      this.notificationService.sendNotification(
        userPost.fcmToken,
        await this.i18n.t('comment.CREATED'),
        `${user.userName} write a comment`,
      )

      return {
        data,
        statusCode: 201,
        message: await this.i18n.t('comment.CREATED'),
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async getById (commentId: number): Promise<CommentInputResponse> {
    const comment = await this.commentRepo.findOne({
      where: {
        id: commentId,
      },
    })

    if (!comment) {
      throw new NotFoundException(await this.i18n.t('comment.NOT_FOUND'))
    }

    const user = await this.userRepo.findOne({
      where: { id: comment.userId },
    })
    if (!user) {
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))
    }

    const post = await this.postRepo.findOne({
      where: { id: comment.postId },
    })
    if (!post) {
      throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))
    }

    const comments = await this.commentRepo.findAll({
      where: { postId: post.id },
    })
    const likes = +(await this.likeService.numPostLikes(post.id)).message

    const data: CommentInput = {
      id: comment.id,
      content: comment.content,
      post: { ...post, likes, comments },
      user,
      createdAt: comment.createdAt,
    }
    const relationCacheKey = `comment:${post.id}`
    await this.redisService.set(relationCacheKey, data)

    return { data }
  }

  async getByData (
    userId: number,
    postId: number,
    content: string,
  ): Promise<CommentInputResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    })
    if (!user) {
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))
    }

    const post = await this.postRepo.findOne({
      where: { id: postId },
    })
    if (!post) {
      throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))
    }

    const comment = await this.commentRepo.findOne({
      where: {
        userId,
        content,
        postId,
      },
    })

    if (!comment) {
      throw new NotFoundException(await this.i18n.t('comment.NOT_FOUND'))
    }

    const comments = await this.commentRepo.findAll({
      where: { postId: post.id },
    })
    const likes = +(await this.likeService.numPostLikes(post.id)).message

    const data: CommentInput = {
      id: comment.id,
      content,
      post: { ...post, likes, comments },
      user,
      createdAt: comment.createdAt,
    }
    const relationCacheKey = `comment:${comment.id}`
    await this.redisService.set(relationCacheKey, data)

    return { data }
  }

  async getCommentPost (
    postId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<CommentsInputResponse> {
    const { rows: data, count: total } = await this.commentRepo.findAndCountAll(
      {
        where: {
          postId,
        },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      },
    )

    if (data.length === 0) {
      throw new NotFoundException(await this.i18n.t('comment.NOT_FOUNDS'))
    }

    const commentsIds = data.map(comment => comment.id)
    const comments = await this.commentLoader.loadMany(commentsIds)

    const items: CommentInput[] = data.map((p, index) => {
      const comment = comments[index]
      if (!comment)
        throw new NotFoundException(this.i18n.t('comment.NOT_FOUND'))

      return comment
    })

    return {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getCommentUserOnPost (
    userId: number,
    postId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<CommentsInputResponse> {
    const { rows: data, count: total } = await this.commentRepo.findAndCountAll(
      {
        where: {
          userId,
          postId,
        },
        offset: (page - 1) * limit,
        limit,
        order: [['createdAt', 'DESC']],
      },
    )

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('comment.NOT_FOUNDS'))

    const commentsIds = data.map(comment => comment.id)
    const comments = await this.commentLoader.loadMany(commentsIds)

    const items: CommentInput[] = data.map((p, index) => {
      const comment = comments[index]
      if (!comment)
        throw new NotFoundException(this.i18n.t('comment.NOT_FOUND'))

      return comment
    })

    return {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getCommentUser (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<CommentsInputResponse> {
    const { rows: data, count: total } = await this.commentRepo.findAndCountAll(
      {
        where: {
          userId,
        },
        offset: (page - 1) * limit,
        limit,
        order: [['createdAt', 'DESC']],
      },
    )

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('comment.NOT_FOUNDS'))

    const commentsIds = data.map(comment => comment.id)
    const comments = await this.commentLoader.loadMany(commentsIds)

    const items: CommentInput[] = data.map((p, index) => {
      const comment = comments[index]
      if (!comment)
        throw new NotFoundException(this.i18n.t('comment.NOT_FOUND'))

      return comment
    })

    return {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getUserByComment (id: number): Promise<User> {
    const comment = await this.commentRepo.findOne({ where: { id } })
    if (!comment)
      throw new NotFoundException(await this.i18n.t('comment.NOT_FOUND'))

    return await this.userRepo.findOne({ where: { id: comment.userId } })
  }

  async getPostByComment (id: number): Promise<Post> {
    const comment = await this.commentRepo.findOne({ where: { id } })
    if (!comment)
      throw new NotFoundException(await this.i18n.t('comment.NOT_FOUND'))

    return await this.postRepo.findOne({ where: { id: comment.postId } })
  }

  async getCountCommentPost (postId: number): Promise<number> {
    const { count: total } = await this.commentRepo.findAndCountAll({
      where: { postId },
    })
    return total
  }

  async update (
    userId: number,
    id: number,
    content: string,
  ): Promise<CommentInputResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    })
    if (!user) {
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))
    }

    const comment = await this.commentRepo.findOne({
      where: { id, userId },
    })
    if (!comment)
      throw new NotFoundException(await this.i18n.t('comment.NOT_FOUND'))

    comment.content = content
    await comment.save()

    const post = await this.postRepo.findOne({
      where: { id: comment.postId },
    })
    if (!post) {
      throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))
    }

    this.websocketGateway.broadcast('commentUdate', {
      comment: comment.id,
      userId,
    })

    const comments = await this.commentRepo.findAll({
      where: { postId: post.id },
    })
    const likes = +(await this.likeService.numPostLikes(post.id)).message

    const userPost = await this.userRepo.findByPk(post.userId)

    const data: CommentInput = {
      id: comment.id,
      content: comment.content,
      post: { ...post, user: userPost, likes, comments },
      user,
      createdAt: comment.createdAt,
    }
    const relationCacheKey = `comment:${post.id}`
    await this.redisService.set(relationCacheKey, data)

    this.notificationService.sendNotification(
      userPost.fcmToken,
      await this.i18n.t('comment.UPDATED'),
      `${user.userName} update a comment`,
    )
    return { message: await this.i18n.t('comment.UPDATED'), data }
  }

  async delete (userId: number, id: number): Promise<CommentInputResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    })
    if (!user) {
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))
    }

    const comment = await this.commentRepo.findOne({
      where: { id, userId },
    })
    if (!comment)
      throw new NotFoundException(await this.i18n.t('comment.NOT_FOUND'))

    if (comment.userId !== userId)
      throw new BadRequestException(
        await this.i18n.t('comment.COMMENTNOTEQUALUSERID'),
      )

    await comment.destroy()

    this.websocketGateway.broadcast('commentDelete', {
      comment: comment.id,
      userId,
    })

    const post = await this.postRepo.findByPk(comment.postId)
    const userPost = await this.userRepo.findByPk(post.userId)

    this.notificationService.sendNotification(
      userPost.fcmToken,
      await this.i18n.t('comment.DELETED'),
      `${user.userName} update a comment`,
    )

    return { message: await this.i18n.t('comment.DELETED'), data: null }
  }
}
