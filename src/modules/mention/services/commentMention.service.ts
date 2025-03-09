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
import { RedisService } from 'src/common/redis/redis.service'
import { CommentMentionLoader } from '../loader/commentMention.loader'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { NotificationService } from 'src/common/queues/notification/notification.service'
import { Limit, Page } from 'src/common/constant/messages.constant'
import { CommentService } from 'src/modules/comment/comment.service'
import {
  CommentMentionInput,
  CommentMentionInputResponse,
  CommentMentionsInputResponse,
} from '../inputs/commentMention.input'

@Injectable()
export class CommentMentionService {
  constructor (
    private readonly commentService: CommentService,
    private readonly i18n: I18nService,
    private readonly mentionLoader: CommentMentionLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    private readonly notificationService: NotificationService,
    @InjectModel(Mention) private mentionRepo: typeof Mention,
    @InjectModel(User) private userRepo: typeof User,
  ) {}

  async create (
    mentionFromId: number,
    mentionToId: number,
    commentId: number,
  ): Promise<CommentMentionInputResponse> {
    const comment = await (await this.commentService.getById(commentId))?.data
    if (!comment)
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
      where: { mentionFromId, mentionToId, commentId },
    })
    if (existedMention)
      throw new BadRequestException(
        await this.i18n.t('commentMention.NOT_FOUND_TO'),
      )

    const mention = await this.mentionRepo.create({
      mentionFromId,
      mentionToId,
      commentId,
    })

    const data: CommentMentionInput = {
      ...mention.dataValues,
      comment,
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

  async findMentionForComment (
    mentionFromId: number,
    mentionToId: number,
    commentId: number,
  ): Promise<CommentMentionInputResponse> {
    const comment = await (await this.commentService.getById(commentId))?.data
    if (!comment)
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

    const mention = await this.mentionRepo.findOne({
      where: { mentionFromId, mentionToId, commentId },
    })
    if (!mention)
      throw new BadRequestException(
        await this.i18n.t('commentMention.NOT_FOUND'),
      )

    const data: CommentMentionInput = {
      ...mention.dataValues,
      comment,
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
  ): Promise<CommentMentionsInputResponse> {
    const mentionFrom = await (
      await this.userRepo.findByPk(mentionFromId)
    ).dataValues
    if (!mentionFrom)
      throw new NotFoundException(
        await this.i18n.t('commentMention.NOT_FOUND_From'),
      )

    const { rows: data, count: total } = await this.mentionRepo.findAndCountAll(
      {
        where: { mentionFromId, commentId: { [Op.not]: null } },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      },
    )

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('post.NOT_FOUNDS'))

    const mentionsIds = data.map(mention => mention.id)
    const mentions = await this.mentionLoader.loadMany(mentionsIds)

    const items: CommentMentionInput[] = data.map((p, index) => {
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
  ): Promise<CommentMentionsInputResponse> {
    const { rows: data, count: total } = await this.mentionRepo.findAndCountAll(
      {
        where: { mentionToId, commentId: { [Op.not]: null } },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      },
    )

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('commentMention.NOT_FOUNDS'))

    const mentionsIds = data.map(mention => mention.id)
    const mentions = await this.mentionLoader.loadMany(mentionsIds)

    const items: CommentMentionInput[] = data.map((p, index) => {
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

  async getMentionsForComment (
    commentId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<CommentMentionsInputResponse> {
    const { rows: data, count: total } = await this.mentionRepo.findAndCountAll(
      {
        where: { commentId },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      },
    )

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('post.NOT_FOUNDS'))

    const mentionsIds = data.map(mention => mention.id)
    const mentions = await this.mentionLoader.loadMany(mentionsIds)

    const items: CommentMentionInput[] = data.map((p, index) => {
      const mention = mentions[index]
      if (!mention)
        throw new NotFoundException(this.i18n.t('commentMention.NOT_FOUND'))

      return mention
    })

    const relationCacheKey = `mention-post:${commentId}`
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

  async deleteMentionFromComment (
    mentionFromId: number,
    mentionToId: number,
    commentId: number,
  ): Promise<CommentMentionInputResponse> {
    const post = await (await this.commentService.getById(commentId))?.data
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
      where: { mentionFromId, mentionToId, commentId },
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
