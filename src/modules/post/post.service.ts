import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { LikeService } from './../like/like.service'
import { Post } from './entity/post.entity '
import { User } from '../users/entity/user.entity'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { I18nService } from 'nestjs-i18n'
import { InjectModel } from '@nestjs/sequelize'
import { Banner } from '../banner/entity/bannner.entity'
import { Comment } from '../comment/entity/comment.entity '
import { postLoader } from './loader/post.loader'
import { Op } from 'sequelize'
import { Limit, Page } from '../../common/constant/messages.constant'
import {
  PostInput,
  PostInputResponse,
  PostsInputResponse,
} from './input/Post.input'

@Injectable()
export class PostService {
  constructor (
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private readonly likeService: LikeService,
    private readonly postLoader: postLoader,
    private readonly websocketGateway: WebSocketMessageGateway,
    @InjectModel(Post) private postRepo: typeof Post,
    @InjectModel(User) private userRepo: typeof User,
    @InjectModel(Banner) private bannerRepo: typeof Banner,
    @InjectModel(Comment) private commentRepo: typeof Comment,
  ) {}

  async create (
    userId: number,
    bannerId: number,
    content: string,
  ): Promise<PostInputResponse> {
    const user = await (
      await this.userRepo.findOne({ where: { id: userId } })
    )?.dataValues
    if (!user) {
      throw new BadRequestException(await this.i18n.t('user.NOT_FOUND'))
    }

    const banner = await (await this.bannerRepo.findByPk(bannerId))?.dataValues
    if (!banner)
      throw new BadRequestException(await this.i18n.t('banner.NOT_FOUND'))

    const transaction = await this.postRepo.sequelize.transaction()

    try {
      const post = await this.postRepo.create(
        { content, userId, bannerId },
        { transaction },
      )

      await post.save({ transaction })

      const data: PostInput = {
        id: post.id,
        content: post.content,
        user,
        likes: 0,
        comments: [],
        banner,
        createdAt: post.createdAt,
      }

      const relationCacheKey = `post:${post.id}`
      await this.redisService.set(relationCacheKey, data)

      this.websocketGateway.broadcast('postCreated', {
        postId: post.id,
        content: post.content,
        userId,
      })

      await transaction.commit()

      return {
        data,
        statusCode: 201,
        message: await this.i18n.t('post.CREATED'),
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async getId (id: number): Promise<PostInputResponse> {
    const post = await this.postRepo.findOne({
      where: { id },
    })
    if (!post) {
      throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))
    }

    const user = await this.userRepo.findOne({
      where: { id: post.userId },
    })
    if (!user) {
      throw new BadRequestException(await this.i18n.t('user.NOT_FOUND'))
    }

    const comments = await this.commentRepo.findAll({
      where: { postId: post.id },
      order: [['createdAt', 'DESC']],
      limit: 10,
    })

    const likes = +(await this.likeService.numPostLikes(post.id)).message

    const banner = await this.bannerRepo.findByPk(post.bannerId)
    if (!banner)
      throw new BadRequestException(await this.i18n.t('banner.NOT_FOUND'))

    const data: PostInput = {
      ...post,
      user,
      comments,
      likes,
      banner,
    }

    const relationCacheKey = `posts:${id}`
    await this.redisService.set(relationCacheKey, post)

    return { data }
  }

  async getContent (
    content?: string,
    page: number = Page,
    limit: number = Limit,
  ): Promise<PostsInputResponse> {
    const { rows: data, count: total } = await this.postRepo.findAndCountAll({
      where: { content: { [Op.iLike]: `%${content}%` } },
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('post.NOT_FOUNDS'))

    const postsIds = data.map(post => post.id)
    const posts = await this.postLoader.loadMany(postsIds)

    const items: PostInput[] = data.map((p, index) => {
      const post = posts[index]
      if (!post) throw new NotFoundException(this.i18n.t('post.NOT_FOUND'))

      return post
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

  async userPosts (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<PostsInputResponse> {
    const { rows: data, count: total } = await this.postRepo.findAndCountAll({
      where: { userId },
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    })

    if (data.length === 0) {
      throw new NotFoundException(await this.i18n.t('post.NOT_FOUNDS'))
    }

    const postsIds = data.map(post => post.id)
    const posts = await this.postLoader.loadMany(postsIds)

    const items: PostInput[] = data.map((p, index) => {
      const post = posts[index]
      if (!post) throw new NotFoundException(this.i18n.t('post.NOT_FOUND'))

      return post
    })

    const relationCacheKey = `posts:${userId}`
    await this.redisService.set(relationCacheKey, posts)

    return {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async update (
    userId: number,
    id: number,
    content: string,
  ): Promise<PostInputResponse> {
    const transaction = await this.postRepo.sequelize.transaction()

    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        transaction,
      })
      if (!user)
        throw new BadRequestException(await this.i18n.t('user.NOT_FOUND'))

      const post = await this.postRepo.findOne({
        where: { id, userId },
        transaction,
      })
      if (!post)
        throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))

      post.content = content
      await post.save({ transaction })

      this.websocketGateway.broadcast('postUpdated', {
        postId: id,
        userId,
      })

      const comments = await this.commentRepo.findAll({
        where: { postId: post.id },
        order: [['createdAt', 'DESC']],
        limit: 10,
      })

      const likes = +(await this.likeService.numPostLikes(post.id)).message

      const banner = await this.bannerRepo.findByPk(post.bannerId)
      if (!banner)
        throw new BadRequestException(await this.i18n.t('banner.NOT_FOUND'))

      const result: PostInputResponse = {
        message: await this.i18n.t('post.UPDATED'),
        data: {
          ...post.dataValues,
          banner: banner.dataValues,
          user: user.dataValues,
          comments,
          likes,
        },
      }

      const relationCacheKey = `post:${post.id}`
      await this.redisService.set(relationCacheKey, result)

      await transaction.commit()
      return result
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async delete (userId: number, id: number): Promise<PostInputResponse> {
    const transaction = await this.postRepo.sequelize.transaction()

    try {
      const post = await this.postRepo.findOne({
        where: { id, userId },
        transaction,
      })
      if (!post) {
        throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))
      }
      if (userId !== post.userId) {
        throw new BadRequestException(
          await this.i18n.t('post.POSTNOTEQUALUSERID'),
        )
      }

      await post.destroy({ transaction })

      this.websocketGateway.broadcast('postDeleted', {
        postId: id,
        userId,
      })

      await transaction.commit()
      return { message: await this.i18n.t('post.DELETED'), data: null }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }
}
