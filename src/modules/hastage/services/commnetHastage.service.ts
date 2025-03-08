import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Op } from 'sequelize'
import { InjectModel } from '@nestjs/sequelize'
import { User } from 'src/modules/users/entity/user.entity'
import { I18nService } from 'nestjs-i18n'
import { CommentService } from 'src/modules/comment/comment.service'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { Limit, Page } from 'src/common/constant/messages.constant'
import { CommnetHashtagLoader } from '../loaders/comment.loader '
import { Hashtag } from '../entity/hastage.entity'
import {
  CommnetHastageInput,
  CommnetHastageInputResponse,
  CommnetHastagesInputResponse,
} from '../inputs/HashtagCommnet.input.dto'

@Injectable()
export class CommnetHashtagService {
  constructor (
    @InjectModel(User) private readonly userRepo: typeof User,
    @InjectModel(Hashtag) private readonly hashtagRepo: typeof Hashtag,
    private readonly i18n: I18nService,
    private readonly commnetService: CommentService,
    private readonly commnetHashtagLoader: CommnetHashtagLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
  ) {}

  async createHashtagComment (
    userId: number,
    commentId: number,
    content: string,
  ): Promise<CommnetHastageInputResponse> {
    const transaction = await this.hashtagRepo.sequelize.transaction()
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
      })
      if (!user)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const commnet = await (await this.commnetService.getById(commentId))?.data
      if (!commnet)
        throw new NotFoundException(await this.i18n.t('commnet.NOT_FOUND'))

      const existingHashtag = await this.hashtagRepo.findOne({
        where: { content, userId, commentId },
        transaction,
      })
      if (existingHashtag)
        throw new BadRequestException(await this.i18n.t('HashtagCommnet.EXIST'))

      const hashtag = await this.hashtagRepo.create(
        { content, userId, commentId },
        { transaction },
      )
      await hashtag.save({ transaction })

      await transaction.commit()

      const data: CommnetHastageInput = {
        ...hashtag.dataValues,
        commnet,
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
        message: await this.i18n.t('HashtagCommnet.CREATED'),
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async findCommentHashtag (
    content: string,
  ): Promise<CommnetHastageInputResponse> {
    const hashtag = await this.hashtagRepo.findOne({ where: { content } })
    if (!hashtag)
      throw new NotFoundException(await this.i18n.t('HashtagCommnet.NOT_FOUND'))

    const user = await this.userRepo.findOne({
      where: { id: hashtag.userId },
    })
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const commnet = await (
      await this.commnetService.getById(hashtag.commentId)
    )?.data
    if (!commnet)
      throw new NotFoundException(await this.i18n.t('commnet.NOT_FOUND'))

    const data: CommnetHastageInput = {
      ...hashtag.dataValues,
      commnet,
      user: user.dataValues,
    }

    const relationCacheKey = `hashtag:${hashtag.id}`
    await this.redisService.set(relationCacheKey, data)

    return { data }
  }

  async findAllCommnetHashtag (
    commentId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<CommnetHastagesInputResponse> {
    const { rows: data, count: total } = await this.hashtagRepo.findAndCountAll(
      {
        where: { commentId },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      },
    )

    if (data.length === 0)
      throw new NotFoundException(
        await this.i18n.t('HashtagCommnet.NOT_FOUNDS'),
      )

    const HashtagsIds = data.map(hashtag => hashtag.id)
    const hashtags = await this.commnetHashtagLoader.loadMany(HashtagsIds)

    const items: CommnetHastageInput[] = data.map((p, index) => {
      const hashtag = hashtags[index]
      if (!hashtag)
        throw new NotFoundException(this.i18n.t('HashtagCommnet.NOT_FOUND'))

      return hashtag
    })

    const result: CommnetHastagesInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    const relationCacheKey = `hashtag-comments:${commentId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async updateHastageCommnet (
    userId: number,
    id: number,
    commentId: number,
    content: string,
  ): Promise<CommnetHastageInputResponse> {
    const transaction = await this.hashtagRepo.sequelize.transaction()
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
      })
      if (!user)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const commnet = await (await this.commnetService.getById(commentId))?.data
      if (!commnet)
        throw new NotFoundException(await this.i18n.t('commnet.NOT_FOUND'))

      const hashtag = await this.hashtagRepo.findOne({
        where: { userId, commentId, id },
        transaction,
      })
      if (!hashtag)
        throw new NotFoundException(this.i18n.t('HashtagComment.NOT_FOUND'))

      hashtag.content = content
      await hashtag.save({ transaction })

      await transaction.commit()

      const data: CommnetHastageInput = {
        ...hashtag.dataValues,
        commnet,
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
  ): Promise<CommnetHastagesInputResponse> {
    const { rows: data, count: total } = await this.hashtagRepo.findAndCountAll(
      {
        where: { userId, commentId: { [Op.not]: null } },
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit,
      },
    )

    if (data.length === 0)
      throw new NotFoundException(
        await this.i18n.t('HashtagComment.NOT_FOUNDS'),
      )

    const hashtagsIds = data.map(hashtag => hashtag.id)
    const hashtags = await this.commnetHashtagLoader.loadMany(hashtagsIds)

    const items: CommnetHastageInput[] = data.map((p, index) => {
      const hashtag = hashtags[index]
      if (!hashtag)
        throw new NotFoundException(this.i18n.t('HashtagComment.NOT_FOUND'))

      return hashtag
    })

    const result: CommnetHastagesInputResponse = {
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
