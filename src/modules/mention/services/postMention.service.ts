import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Op } from 'sequelize'
import { InjectModel } from '@nestjs/sequelize'
import { Mention } from '../entity/mention.entity '
import { PostService } from 'src/modules/post/post.service'
import { User } from 'src/modules/users/entity/user.entity'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { I18nService } from 'nestjs-i18n'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { NotificationService } from 'src/common/queues/notification/notification.service'
import { Limit, Page } from 'src/common/constant/messages.constant'
import { PostMentionLoader } from '../loader/postMention.loader'
import {
  PostMentionInput,
  PostMentionInputResponse,
  PostMentionsInputResponse,
} from '../inputs/postMention.input'

@Injectable()
export class PostMentionService {
  constructor (
    private readonly postService: PostService,
    private readonly i18n: I18nService,
    private readonly mentionLoader: PostMentionLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    private readonly notificationService: NotificationService,
    @InjectModel(Mention) private mentionRepo: typeof Mention,
    @InjectModel(User) private userRepo: typeof User,
  ) {}

  async create (
    mentionFromId: number,
    mentionToId: number,
    postId: number,
  ): Promise<PostMentionInputResponse> {
    const post = await (await this.postService.getId(postId))?.data
    if (!post) throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))

    const mentionTo = await (
      await this.userRepo.findByPk(mentionToId)
    ).dataValues
    if (!mentionTo)
      throw new NotFoundException(await this.i18n.t('postMention.NOT_FOUND_TO'))

    const mentionFrom = await (
      await this.userRepo.findByPk(mentionFromId)
    ).dataValues
    if (!mentionFrom)
      throw new NotFoundException(
        await this.i18n.t('postMention.NOT_FOUND_From'),
      )

    const existedMention = await this.mentionRepo.findOne({
      where: { mentionFromId, mentionToId, postId },
    })
    if (existedMention)
      throw new BadRequestException(
        await this.i18n.t('postMention.NOT_FOUND_TO'),
      )

    const mention = await this.mentionRepo.create({
      mentionFromId,
      mentionToId,
      postId,
    })

    const data: PostMentionInput = {
      ...mention.dataValues,
      post,
      mentionFrom,
      mentionTo,
    }

    const relationCacheKey = `mention:${mention.id}`
    await this.redisService.set(relationCacheKey, data)

    this.websocketGateway.broadcast('postMentionCreated', {
      mentionId: mention.id,
    })

    this.notificationService.sendNotification(
      mentionTo.fcmToken,
      await this.i18n.t('postMention.CREATED'),
      `${mentionFrom.userName} mention you on post`,
    )

    return {
      data,
      statusCode: 201,
      message: await this.i18n.t('postMention.CREATED'),
    }
  }

  async findMentionForPost (
    mentionFromId: number,
    mentionToId: number,
    postId: number,
  ): Promise<PostMentionInputResponse> {
    const post = await (await this.postService.getId(postId))?.data
    if (!post) throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))

    const mentionTo = await (
      await this.userRepo.findByPk(mentionToId)
    ).dataValues
    if (!mentionTo)
      throw new NotFoundException(await this.i18n.t('postMention.NOT_FOUND_TO'))

    const mentionFrom = await (
      await this.userRepo.findByPk(mentionFromId)
    ).dataValues
    if (!mentionFrom)
      throw new NotFoundException(
        await this.i18n.t('postMention.NOT_FOUND_From'),
      )

    const mention = await this.mentionRepo.findOne({
      where: { mentionFromId, mentionToId, postId },
    })
    if (mention)
      throw new BadRequestException(await this.i18n.t('postMention.NOT_FOUND'))

    const data: PostMentionInput = {
      ...mention.dataValues,
      post,
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
  ): Promise<PostMentionsInputResponse> {
    const mentionFrom = await (
      await this.userRepo.findByPk(mentionFromId)
    ).dataValues
    if (!mentionFrom)
      throw new NotFoundException(
        await this.i18n.t('postMention.NOT_FOUND_From'),
      )

    const { rows: data, count: total } =
      await this.mentionRepo.findAndCountAll({
        where: { mentionFromId, postId: { [Op.not]: null } },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      })

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('post.NOT_FOUNDS'))

    const mentionsIds = data.map(mention => mention.id)
    const mentions = await this.mentionLoader.loadMany(mentionsIds)

    const items: PostMentionInput[] = data.map((p, index) => {
      const mention = mentions[index]
      if (!mention)
        throw new NotFoundException(this.i18n.t('postMention.NOT_FOUND'))

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
  ): Promise<PostMentionsInputResponse> {
    const { rows: data, count: total } =
      await this.mentionRepo.findAndCountAll({
        where: { mentionToId, postId: { [Op.not]: null } },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      })

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('post.NOT_FOUNDS'))

    const mentionsIds = data.map(mention => mention.id)
    const mentions = await this.mentionLoader.loadMany(mentionsIds)

    const items: PostMentionInput[] = data.map((p, index) => {
      const mention = mentions[index]
      if (!mention)
        throw new NotFoundException(this.i18n.t('postMention.NOT_FOUND'))

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

  async getMentionsForPost (
    postId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<PostMentionsInputResponse> {
    const { rows: data, count: total } =
      await this.mentionRepo.findAndCountAll({
        where: { postId },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      })

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('post.NOT_FOUNDS'))

    const mentionsIds = data.map(mention => mention.id)
    const mentions = await this.mentionLoader.loadMany(mentionsIds)

    const items: PostMentionInput[] = data.map((p, index) => {
      const mention = mentions[index]
      if (!mention)
        throw new NotFoundException(this.i18n.t('postMention.NOT_FOUND'))

      return mention
    })

    const relationCacheKey = `mention-post:${postId}`
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

  async deleteMentionFromPost (
    mentionFromId: number,
    mentionToId: number,
    postId: number,
  ): Promise<PostMentionInputResponse> {
    const post = await (await this.postService.getId(postId))?.data
    if (!post) throw new NotFoundException(await this.i18n.t('post.NOT_FOUND'))

    const mentionTo = await (
      await this.userRepo.findByPk(mentionToId)
    )?.dataValues
    if (!mentionTo)
      throw new NotFoundException(await this.i18n.t('postMention.NOT_FOUND_TO'))

    const mentionFrom = await (
      await this.userRepo.findByPk(mentionFromId)
    ).dataValues
    if (!mentionFrom)
      throw new NotFoundException(
        await this.i18n.t('postMention.NOT_FOUND_From'),
      )

    const mention = await this.mentionRepo.findOne({
      where: { mentionFromId, mentionToId, postId },
    })
    if (!mention)
      throw new BadRequestException(
        await this.i18n.t('postMention.NOT_FOUND_TO'),
      )

    await mention.destroy()

    const relationCacheKey = `mention:${mention.id}`
    await this.redisService.set(relationCacheKey, null)

    this.websocketGateway.broadcast('postMentionDeleted', {
      mentionId: mention.id,
    })

    this.notificationService.sendNotification(
      mentionTo.fcmToken,
      await this.i18n.t('postMention.DELETED'),
      `${mentionFrom.userName} delete mention you on post`,
    )

    return { message: await this.i18n.t('postMention.DELETED'), data: null }
  }
}
