import { Injectable, NotFoundException } from '@nestjs/common'
import { Interaction } from './entity/interaction.entity'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { InterActionType } from 'src/common/constant/enum.constant'
import { InteractionLoader } from './loader/interaction.loader'
import { User } from '../users/entity/user.entity'
import { CreateInteractionDto } from './dtos/CreateInteraction.dto'
import { Banner } from '../banner/entity/bannner.entity'
import { InjectModel } from '@nestjs/sequelize'
import { I18nService } from 'nestjs-i18n'
import { CampaignService } from '../campaign/campaign.service'
import { Limit, Page } from 'src/common/constant/messages.constant'
import { col, fn } from 'sequelize'
import {
  InteractionInput,
  InteractionInputResponse,
  InteractionsInputResponse,
} from './input/interaction.input'

@Injectable()
export class InteractionService {
  constructor (
    private readonly i18n: I18nService,
    private readonly interactionLoader: InteractionLoader,
    private readonly campaignService: CampaignService,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    @InjectModel(Banner) private bannerRepo: typeof Banner,
    @InjectModel(User) private userRepo: typeof User,
    @InjectModel(Interaction) private interactionRepo: typeof Interaction,
  ) {}

  async create (
    userId: number,
    interactionDto: CreateInteractionDto,
  ): Promise<InteractionInputResponse> {
    const transaction = await this.interactionRepo.sequelize.transaction()

    try {
      const banner = await this.bannerRepo.findByPk(interactionDto.bannerId)
      if (!banner)
        throw new NotFoundException(await this.i18n.t('banner.NOT_FOUND'))

      const user = await this.userRepo.findByPk(userId)
      if (!user)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const exist = await this.interactionRepo.findOne({
        where: {
          bannerId: interactionDto.bannerId,
          userId,
          type: interactionDto.type,
        },
        transaction,
      })
      if (exist) {
        await transaction.rollback()
        return null
      }

      const interaction = await this.interactionRepo.create(
        { userId, ...interactionDto },
        { transaction },
      )

      const createdBy = await this.userRepo.findByPk(banner.createdBy, {
        transaction,
      })
      if (!createdBy)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const campaign = await (
        await this.campaignService.getCampainById(banner.campaignId)
      )?.data
      if (!campaign)
        throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUND'))

      const views = +(await this.countView(banner.id))?.message
      const clicks = +(await this.countClick(banner.id))?.message

      await transaction.commit()

      const result: InteractionInputResponse = {
        statusCode: 201,
        message: await this.i18n.t('interaction.CREATED'),
        data: {
          ...interaction,
          user,
          banner: { ...banner, views, clicks, createdBy, campaign },
        },
      }

      const relationCacheKey = `interaction:${interaction.id}`
      await this.redisService.set(relationCacheKey, result)

      this.websocketGateway.broadcast('interactionCreated', {
        interactionId: interaction.id,
        interaction,
      })

      return result
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async getById (id: number): Promise<InteractionInputResponse> {
    const interaction = await this.interactionRepo.findOne({
      where: { id },
    })

    if (!interaction)
      throw new NotFoundException(await this.i18n.t('interaction.NOT_FOUND'))

    const banner = await this.bannerRepo.findByPk(interaction.bannerId)
    if (!banner)
      throw new NotFoundException(await this.i18n.t('banner.NOT_FOUND'))

    const user = await this.userRepo.findByPk(interaction.userId)
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const createdBy = await this.userRepo.findByPk(banner.createdBy)
    if (!createdBy)
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const campaign = await (
      await this.campaignService.getCampainById(banner.campaignId)
    )?.data
    if (!campaign)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUND'))

    const views = +(await this.countView(banner.id))?.message
    const clicks = +(await this.countClick(banner.id))?.message

    const result: InteractionInputResponse = {
      data: {
        ...interaction,
        user,
        banner: { ...banner, views, clicks, createdBy, campaign },
      },
    }

    return result
  }

  async get (
    page: number = Page,
    limit: number = Limit,
  ): Promise<InteractionsInputResponse> {
    const { rows: data, count: total } =
      await this.interactionRepo.findAndCountAll({
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      })

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('interaction.NOT_FOUNDS'))

    const interactionIds = data.map(interaction => interaction.id)
    const interactions = await this.interactionLoader.loadMany(interactionIds)

    const items: InteractionInput[] = data.map((i, index) => {
      const interaction = interactions[index]

      return interaction
    })

    const result: InteractionsInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    return result
  }

  async getUserInteractions (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<InteractionsInputResponse> {
    const { rows: data, count: total } =
      await this.interactionRepo.findAndCountAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      })

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('interaction.NOT_FOUNDS'))

    const interactionIds = data.map(interaction => interaction.id)
    const interactions = await this.interactionLoader.loadMany(interactionIds)

    const items: InteractionInput[] = data.map((i, index) => {
      const interaction = interactions[index]

      return interaction
    })

    const result: InteractionsInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    const relationCacheKey = `interaction-user:${userId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async countClick (bannerId: number): Promise<InteractionInputResponse> {
    const banner = await this.bannerRepo.findByPk(bannerId)
    if (!banner)
      throw new NotFoundException(await this.i18n.t('interaction.NOT_FOUNDS'))

    const number =
      (await this.interactionRepo.count({
        where: { bannerId, type: InterActionType.CLICK },
      })) || 0

    return { data: null, message: `${number}` }
  }

  async countView (bannerId: number): Promise<InteractionInputResponse> {
    const banner = await this.bannerRepo.findByPk(bannerId)
    if (!banner)
      throw new NotFoundException(await this.i18n.t('interaction.NOT_FOUNDS'))

    const number =
      (await this.interactionRepo.count({
        where: { bannerId, type: InterActionType.VIEW },
      })) || 0

    return { data: null, message: `${number}` }
  }

  async getMostClicks (
    limit: number = Limit,
  ): Promise<InteractionsInputResponse> {
    const data = await this.interactionRepo.findAll({
      attributes: ['bannerId', [fn('COUNT', col('id')), 'count']],
      group: ['bannerId'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit,
      raw: true,
    })

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('interaction.NOT_FOUNDS'))

    const interactionIds = data.map(interaction => interaction.id)
    const interactions = await this.interactionLoader.loadMany(interactionIds)

    const items: InteractionInput[] = data.map((i, index) => {
      const interaction = interactions[index]

      return interaction
    })

    return { items }
  }

  async getMostViews (
    limit: number = Limit,
  ): Promise<InteractionsInputResponse> {
    const data = await this.interactionRepo.findAll({
      attributes: ['bannerId', [fn('COUNT', col('id')), 'count']],
      group: ['bannerId'],
      where: { type: InterActionType.VIEW },
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit,
      raw: true,
    })

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('interaction.NOT_FOUNDS'))

    const interactionIds = data.map(interaction => interaction.id)
    const interactions = await this.interactionLoader.loadMany(interactionIds)

    const items: InteractionInput[] = data.map((i, index) => {
      const interaction = interactions[index]

      return interaction
    })

    return { items }
  }
}
