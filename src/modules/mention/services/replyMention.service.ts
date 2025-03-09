import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Op } from 'sequelize'
import { InjectModel } from '@nestjs/sequelize'
import { Mention } from '../entity/mention.entity '
import { User } from 'src/modules/users/entity/user.entity'
import { I18nService } from 'nestjs-i18n'
import { RelyMentionLoader } from '../loader/replyMention.loader'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { NotificationService } from 'src/common/queues/notification/notification.service'
import { Limit, Page } from 'src/common/constant/messages.constant'
import { ReplyService } from 'src/modules/reply/reply.service'
import {
  ReplyMentionInput,
  ReplyMentionInputResponse,
  ReplyMentionsInputResponse,
} from '../inputs/replyMention.input'

@Injectable()
export class ReplyMentionService {
  constructor (
    private readonly replyService: ReplyService,
    private readonly i18n: I18nService,
    private readonly mentionLoader: RelyMentionLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    private readonly notificationService: NotificationService,
    @InjectModel(Mention) private mentionRepo: typeof Mention,
    @InjectModel(User) private userRepo: typeof User,
  ) {}

  async create (
    mentionFromId: number,
    mentionToId: number,
    replyId: number,
  ): Promise<ReplyMentionInputResponse> {
    const reply = await (await this.replyService.getId(replyId))?.data
    if (!reply)
      throw new NotFoundException(await this.i18n.t('comment.NOT_FOUND'))

    const mentionTo = await (
      await this.userRepo.findByPk(mentionToId)
    ).dataValues
    if (!mentionTo)
      throw new NotFoundException(
        await this.i18n.t('commentMention.NOT_FOUND_TO'),
      )

    const mentionFrom = await (
      await this.userRepo.findByPk(mentionFromId)
    ).dataValues
    if (!mentionFrom)
      throw new NotFoundException(
        await this.i18n.t('commentMention.NOT_FOUND_From'),
      )

    const existedMention = await this.mentionRepo.findOne({
      where: { mentionFromId, mentionToId, replyId },
    })
    if (existedMention)
      throw new BadRequestException(
        await this.i18n.t('commentMention.NOT_FOUND_TO'),
      )

    const mention = await this.mentionRepo.create({
      mentionFromId,
      mentionToId,
      replyId,
    })

    const data: ReplyMentionInput = {
      ...mention.dataValues,
      reply,
      mentionFrom,
      mentionTo,
    }

    const relationCacheKey = `mention:${mention.id}`
    await this.redisService.set(relationCacheKey, data)

    this.websocketGateway.broadcast('commentMentionCreated', {
      mentionId: mention.id,
    })

    this.notificationService.sendNotification(
      mentionTo.fcmToken,
      await this.i18n.t('commentMention.CREATED'),
      `${mentionFrom.userName} mention you on comment`,
    )

    return {
      data,
      statusCode: 201,
      message: await this.i18n.t('commentMention.CREATED'),
    }
  }

  async findMentionForReply (
    mentionFromId: number,
    mentionToId: number,
    replyId: number,
  ): Promise<ReplyMentionInputResponse> {
    const reply = await (await this.replyService.getId(replyId))?.data
    if (!reply) throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))

    const mentionTo = await (
      await this.userRepo.findByPk(mentionToId)
    ).dataValues
    if (!mentionTo)
      throw new NotFoundException(
        await this.i18n.t('commentMention.NOT_FOUND_TO'),
      )

    const mentionFrom = await (
      await this.userRepo.findByPk(mentionFromId)
    ).dataValues
    if (!mentionFrom)
      throw new NotFoundException(
        await this.i18n.t('commentMention.NOT_FOUND_From'),
      )

    const mention = await this.mentionRepo.findOne({
      where: { mentionFromId, mentionToId, replyId },
    })
    if (!mention)
      throw new BadRequestException(
        await this.i18n.t('commentMention.NOT_FOUND'),
      )

    const data: ReplyMentionInput = {
      ...mention.dataValues,
      reply,
      mentionFrom,
      mentionTo,
    }

    const relationCacheKey = `mention:${mention.id}`
    await this.redisService.set(relationCacheKey, data)

    return { data }
  }

  async getMentionsReceived (
    mentionFromId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<ReplyMentionsInputResponse> {
    const mentionFrom = await (
      await this.userRepo.findByPk(mentionFromId)
    ).dataValues
    if (!mentionFrom)
      throw new NotFoundException(
        await this.i18n.t('commentMention.NOT_FOUND_From'),
      )

    const { rows: data, count: total } = await this.mentionRepo.findAndCountAll(
      {
        where: { mentionFromId, replyId: { [Op.not]: null } },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      },
    )

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('post.NOT_FOUNDS'))

    const mentionsIds = data.map(mention => mention.id)
    const mentions = await this.mentionLoader.loadMany(mentionsIds)

    const items: ReplyMentionInput[] = data.map((p, index) => {
      const mention = mentions[index]
      if (!mention)
        throw new NotFoundException(this.i18n.t('commentMention.NOT_FOUND'))

      return mention
    })

    const relationCacheKey = `mention-mentionFrom:${mentionFromId}`
    await this.redisService.set(relationCacheKey, data)

    return {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getMentionsSent (
    mentionToId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<ReplyMentionsInputResponse> {
    const { rows: data, count: total } = await this.mentionRepo.findAndCountAll(
      {
        where: { mentionToId, replyId: { [Op.not]: null } },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      },
    )

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('post.NOT_FOUNDS'))

    const mentionsIds = data.map(mention => mention.id)
    const mentions = await this.mentionLoader.loadMany(mentionsIds)

    const items: ReplyMentionInput[] = data.map((p, index) => {
      const mention = mentions[index]
      if (!mention)
        throw new NotFoundException(this.i18n.t('commentMention.NOT_FOUND'))

      return mention
    })

    const relationCacheKey = `mention-mentionTo:${mentionToId}`
    await this.redisService.set(relationCacheKey, data)

    return {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getMentionsForReply (
    replyId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<ReplyMentionsInputResponse> {
    const { rows: data, count: total } = await this.mentionRepo.findAndCountAll(
      {
        where: { replyId },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      },
    )

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('post.NOT_FOUNDS'))

    const mentionsIds = data.map(mention => mention.id)
    const mentions = await this.mentionLoader.loadMany(mentionsIds)

    const items: ReplyMentionInput[] = data.map((p, index) => {
      const mention = mentions[index]
      if (!mention)
        throw new NotFoundException(this.i18n.t('commentMention.NOT_FOUND'))

      return mention
    })

    const relationCacheKey = `mention-post:${replyId}`
    await this.redisService.set(relationCacheKey, data)

    return {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async deleteMentionFromReply (
    mentionFromId: number,
    mentionToId: number,
    replyId: number,
  ): Promise<ReplyMentionInputResponse> {
    const post = await (await this.replyService.getId(replyId))?.data
    if (!post) throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))

    const mentionTo = await (
      await this.userRepo.findByPk(mentionToId)
    ).dataValues
    if (!mentionTo)
      throw new NotFoundException(
        await this.i18n.t('commentMention.NOT_FOUND_TO'),
      )

    const mentionFrom = await (
      await this.userRepo.findByPk(mentionFromId)
    ).dataValues
    if (!mentionFrom)
      throw new NotFoundException(
        await this.i18n.t('commentMention.NOT_FOUND_From'),
      )

    const mention = await this.mentionRepo.findOne({
      where: { mentionFromId, mentionToId, replyId },
    })
    if (!mention)
      throw new BadRequestException(
        await this.i18n.t('commentMention.NOT_FOUND_TO'),
      )

    await mention.destroy()

    const relationCacheKey = `mention:${mention.id}`
    await this.redisService.set(relationCacheKey, null)

    this.websocketGateway.broadcast('commentMentionDeleted', {
      mentionId: mention.id,
    })

    this.notificationService.sendNotification(
      mentionTo.fcmToken,
      await this.i18n.t('commentMention.DELETED'),
      `${mentionFrom.userName} delete mention you on post`,
    )

    return { message: await this.i18n.t('commentMention.DELETED'), data: null }
  }
}
