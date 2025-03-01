import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Post } from './entity/post.entity '
import { UploadService } from '../../common/upload/upload.service'
import { User } from '../users/entity/user.entity'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { CreateImagDto } from 'src/common/upload/dtos/createImage.dto'
import { I18nService } from 'nestjs-i18n'
import {
  PostInput,
  PostInputResponse,
  PostsInputResponse,
} from './input/Post.input'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { Limit, Page } from '../../common/constant/messages.constant'

@Injectable()
export class PostService {
  constructor (
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private readonly uploadService: UploadService,
    // private readonly likeService: LikeService,
    private readonly websocketGateway: WebSocketMessageGateway,
    @InjectModel(Post) private postRepo: typeof Post,
    @InjectModel(User) private userRepo: typeof User, // @InjectRepository(Comment) private commentRepository: Repository<Comment>,
  ) {}

  async create (
    userId: number,
    content: string,
    createImageDto: CreateImagDto,
  ): Promise<PostInputResponse> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) {
      throw new BadRequestException(await this.i18n.t('user.NOT_FOUND'))
    }

    const transaction = await this.postRepo.sequelize.transaction()

    try {
      const post = await this.postRepo.create(
        { content, userId },
        { transaction },
      )

      const image = await this.uploadService.uploadImage(createImageDto)
      post.imageUrl = image
      await post.save({ transaction })

      const data: PostInput = {
        id: post.id,
        content: post.content,
        user,
        imageUrl: image,
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

    // const comments = await this.commentRepository.find({
    //   where: { id: post.userId },
    // })

    // const likes = await this.likeService.numPostLikes(post.id)

    const data: PostInput = {
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      user,
      // comments,
      // likes,
      createdAt: post.createdAt,
    }

    const relationCacheKey = `posts:${id}`
    await this.redisService.set(relationCacheKey, post)

    return { data }
  }

  async getContent (
    content?: string,
    limit: number = Limit,
    page: number = Page,
  ): Promise<PostsInputResponse> {
    const { rows: posts, count: total } = await this.postRepo.findAndCountAll({
      where: { content: { [Op.iLike]: `%${content}%` } },
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'ASC']],
    })

    if (posts.length === 0) {
      throw new NotFoundException(await this.i18n.t('post.NOT_FOUNDS'))
    }

    return {
      items: posts,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async userPosts (
    userId: number,
    limit: number = Limit,
    page: number = Page,
  ): Promise<PostsInputResponse> {
    const { rows: posts, count: total } = await this.postRepo.findAndCountAll({
      where: { userId },
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'ASC']],
    })

    if (posts.length === 0) {
      throw new NotFoundException(await this.i18n.t('post.NOT_FOUNDS'))
    }

    const relationCacheKey = `posts:${userId}`
    await this.redisService.set(relationCacheKey, posts)

    return {
      items: posts,
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
      if (!user) {
        throw new BadRequestException(await this.i18n.t('user.NOT_FOUND'))
      }

      const post = await this.postRepo.findOne({
        where: { id, userId },
        transaction,
      })
      if (!post) {
        throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))
      }

      post.content = content
      await post.save({ transaction })

      this.websocketGateway.broadcast('postUpdated', {
        postId: id,
        userId,
      })

      const result: PostInputResponse = {
        message: await this.i18n.t('post.UPDATED'),
        data: {
          id: post.id,
          content: post.content,
          user,
          imageUrl: post.imageUrl,
          createdAt: post.createdAt,
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

  async delete (userId: number, id: number): Promise<string> {
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
      await this.uploadService.deleteImage(post.imageUrl)

      this.websocketGateway.broadcast('postDeleted', {
        postId: id,
        userId,
      })

      await transaction.commit()
      return await this.i18n.t('post.DELETED')
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }
}
