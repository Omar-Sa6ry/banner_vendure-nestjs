import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { User } from 'src/modules/users/entity/user.entity'
import { I18nService } from 'nestjs-i18n'
import { Hashtag } from '../entity/hastage.entity'
import { PostHashtagLoader } from '../loaders/postHashtage.loader'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { PostService } from 'src/modules/post/post.service'
import { Limit, Page } from 'src/common/constant/messages.constant'
import { Op } from 'sequelize'
import {
  PostHashtagsInputResponse,
  PostHastageInput,
  PostHastageInputResponse,
} from '../inputs/HashtagPost.input.dto'

@Injectable()
export class PostHashtagService {
  constructor (
    @InjectModel(User) private readonly userRepo: typeof User,
    @InjectModel(Hashtag) private readonly hashtagRepo: typeof Hashtag,
    private readonly i18n: I18nService,
    private readonly postService: PostService,
    private readonly postHashtagLoader: PostHashtagLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
  ) {}

  async createHastagePost (
    userId: number,
    postId: number,
    content: string,
  ): Promise<PostHastageInputResponse> {
    const transaction = await this.hashtagRepo.sequelize.transaction()
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
      })
      if (!user)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const post = await (await this.postService.getId(postId))?.data
      if (!post)
        throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))

      const existingHashtag = await this.hashtagRepo.findOne({
        where: { content, userId, postId },
        transaction,
      })
      if (existingHashtag)
        throw new BadRequestException(await this.i18n.t('HashtagPost.EXIST'))

      const hashtag = await this.hashtagRepo.create(
        { content, userId, postId },
        { transaction },
      )
      await hashtag.save({ transaction })

      await transaction.commit()

      const data: PostHastageInput = {
        ...hashtag.dataValues,
        post,
        user: user.dataValues,
      }

      const relationCacheKey = `hashtag:${hashtag.id}`
      await this.redisService.set(relationCacheKey, data)

      this.websocketGateway.broadcast('HashtagCreated', {
        hashtag: hashtag.id,
      })

      return {
        data,
        statusCode: 201,
        message: await this.i18n.t('HashtagPost.CREATED'),
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async findPostHashtag (content: string): Promise<PostHastageInputResponse> {
    const hashtag = await this.hashtagRepo.findOne({
      where: { content },
    })
    if (!hashtag)
      throw new BadRequestException(await this.i18n.t('HashtagPost.NOT_FOUND'))

    const post = await (await this.postService.getId(hashtag.postId))?.data
    if (!post) throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))

    const user = await this.userRepo.findOne({
      where: { id: hashtag.userId },
    })
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const data: PostHastageInput = {
      ...hashtag.dataValues,
      post,
      user: user.dataValues,
    }

    const relationCacheKey = `hashtag:${hashtag.id}`
    await this.redisService.set(relationCacheKey, data)

    return { data }
  }

  async findAllPostHashtag (
    postId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<PostHashtagsInputResponse> {
    const { rows: data, count: total } = await this.hashtagRepo.findAndCountAll(
      {
        where: { postId },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      },
    )

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('HashtagPost.NOT_FOUNDS'))

    const HashtagsIds = data.map(hashtag => hashtag.id)
    const hashtags = await this.postHashtagLoader.loadMany(HashtagsIds)

    const items: PostHastageInput[] = data.map((p, index) => {
      const hashtag = hashtags[index]
      if (!hashtag)
        throw new NotFoundException(this.i18n.t('HashtagPost.NOT_FOUND'))

      return hashtag
    })

    const result: PostHashtagsInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    const relationCacheKey = `hashtag-posts:${postId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async updateHastagePost (
    userId: number,
    id: number,
    postId: number,
    content: string,
  ): Promise<PostHastageInputResponse> {
    const transaction = await this.hashtagRepo.sequelize.transaction()
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
      })
      if (!user)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const post = await (await this.postService.getId(postId))?.data
      if (!post)
        throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))

      const hashtag = await this.hashtagRepo.findOne({
        where: { userId, postId, id },
        transaction,
      })
      if (!hashtag)
        throw new NotFoundException(this.i18n.t('HashtagPost.NOT_FOUND'))

      hashtag.content = content
      await hashtag.save({ transaction })

      await transaction.commit()

      const data: PostHastageInput = {
        ...hashtag.dataValues,
        post,
        user: user.dataValues,
      }

      const relationCacheKey = `hashtag:${hashtag.id}`
      await this.redisService.set(relationCacheKey, data)

      this.websocketGateway.broadcast('HashtagUpdated', {
        hashtag: hashtag.id,
      })

      return { data, message: this.i18n.t('HashtagPost.UPDATED') }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async findAllUserHashtagOnPost (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<PostHashtagsInputResponse> {
    const { rows: data, count: total } = await this.hashtagRepo.findAndCountAll(
      {
        where: { userId, postId: { [Op.not]: null } },
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit,
      },
    )

    console.log(data)
    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('HashtagPost.NOT_FOUNDS'))

    const HashtagsIds = data.map(hashtag => hashtag.id)
    const hashtags = await this.postHashtagLoader.loadMany(HashtagsIds)

    const items: PostHastageInput[] = data.map((p, index) => {
      const hashtag = hashtags[index]
      if (!hashtag)
        throw new NotFoundException(this.i18n.t('HashtagPost.NOT_FOUND'))

      return hashtag
    })

    const result: PostHashtagsInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    const relationCacheKey = `hashtag-users:${userId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }
}
