import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { User } from 'src/modules/users/entity/user.entity'
import { Limit, Page } from 'src/common/constant/messages.constant'
import { ReplyHashtagLoader } from '../loaders/replyHashtag.loader '
import { Hashtag } from '../entity/hastage.entity'
import { I18nService } from 'nestjs-i18n'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { ReplyService } from 'src/modules/reply/reply.service'
import {
  ReplyHastageInput,
  ReplyHastageInputResponse,
  ReplyHastagesInputResponse,
} from '../inputs/HashtagReply.input.dto'

@Injectable()
export class ReplyHashtagService {
  constructor (
    private readonly i18n: I18nService,
    private readonly replyService: ReplyService,
    private readonly replyHashtagLoader: ReplyHashtagLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    @InjectModel(User) private readonly userRepo: typeof User,
    @InjectModel(Hashtag) private readonly hashtagRepo: typeof Hashtag,
  ) {}

  async createHastageReply (
    userId: number,
    replyId: number,
    content: string,
  ): Promise<ReplyHastageInputResponse> {
    const transaction = await this.hashtagRepo.sequelize.transaction()
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
      })
      if (!user)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const reply = await (await this.replyService.getId(replyId))?.data
      if (!reply)
        throw new NotFoundException(await this.i18n.t('reply.NOT_FOUND'))

      const existingHashtag = await this.hashtagRepo.findOne({
        where: { content, userId, replyId },
        transaction,
      })
      if (existingHashtag)
        throw new BadRequestException(await this.i18n.t('HashtagReply.EXIST'))

      const hashtag = await this.hashtagRepo.create(
        { content, userId, replyId },
        { transaction },
      )
      await hashtag.save({ transaction })

      await transaction.commit()

      const data: ReplyHastageInput = {
        ...hashtag.dataValues,
        reply,
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
        message: await this.i18n.t('HashtagReply.CREATED'),
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async findReplyHashtag (id: number): Promise<ReplyHastageInputResponse> {
    const hashtag = await this.hashtagRepo.findOne({ where: { id } })
    if (!hashtag)
      throw new NotFoundException(await this.i18n.t('HashtagReply.NOT_FOUND'))

    const user = await this.userRepo.findOne({
      where: { id: hashtag.userId },
    })
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const reply = await (await this.replyService.getId(hashtag.replyId))?.data
    if (!reply)
      throw new NotFoundException(await this.i18n.t('reply.NOT_FOUND'))

    const data: ReplyHastageInput = {
      ...hashtag.dataValues,
      reply,
      user: user.dataValues,
    }

    const relationCacheKey = `hashtag:${hashtag.id}`
    await this.redisService.set(relationCacheKey, data)

    return { data }
  }

  async findAllReplyHashtag (
    replyId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<ReplyHastagesInputResponse> {
    const { rows: data, count: total } = await this.hashtagRepo.findAndCountAll(
      {
        where: { replyId },
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
    const hashtags = await this.replyHashtagLoader.loadMany(HashtagsIds)

    const items: ReplyHastageInput[] = data.map((p, index) => {
      const hashtag = hashtags[index]
      if (!hashtag)
        throw new NotFoundException(this.i18n.t('HashtagReply.NOT_FOUND'))

      return hashtag
    })

    const result: ReplyHastagesInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    const relationCacheKey = `hashtag-replies:${replyId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async updateHastageReply (
    userId: number,
    id: number,
    replyId: number,
    content: string,
  ): Promise<ReplyHastageInputResponse> {
    const transaction = await this.hashtagRepo.sequelize.transaction()
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
      })
      if (!user)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const reply = await (await this.replyService.getId(replyId))?.data
      if (!reply)
        throw new NotFoundException(await this.i18n.t('reply.NOT_FOUND'))

      const hashtag = await this.hashtagRepo.findOne({
        where: { userId, replyId, id },
      })
      if (!hashtag)
        throw new NotFoundException(this.i18n.t('HashtagReply.NOT_FOUND'))

      hashtag.content = content
      await hashtag.save({ transaction })

      await transaction.commit()

      const data: ReplyHastageInput = {
        ...hashtag.dataValues,
        reply,
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
  ): Promise<ReplyHastagesInputResponse> {
    const { rows: data, count: total } = await this.hashtagRepo.findAndCountAll(
      {
        where: { userId, replyId: { [Op.not]: null } },
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit,
      },
    )

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('HashtagReply.NOT_FOUNDS'))

    const hashtagsIds = data.map(hashtag => hashtag.id)
    const hashtags = await this.replyHashtagLoader.loadMany(hashtagsIds)

    const items: ReplyHastageInput[] = data.map((p, index) => {
      const hashtag = hashtags[index]
      if (!hashtag)
        throw new NotFoundException(this.i18n.t('HashtagReply.NOT_FOUND'))

      return hashtag
    })

    const result: ReplyHastagesInputResponse = {
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

  async deleteHastage (id: number): Promise<ReplyHastageInputResponse> {
    const hashtag = await this.hashtagRepo.findByPk(id)
    if (!hashtag)
      throw new NotFoundException(await this.i18n.t('HashtagReply.NOT_FOUND'))

    await hashtag.destroy()

    return { data: null, message: await this.i18n.t('HashtagReply.DELETED') }
  }
}
