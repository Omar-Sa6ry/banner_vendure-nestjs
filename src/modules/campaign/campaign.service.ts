import { Injectable, NotFoundException } from '@nestjs/common'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { Campaign } from './entity/campaign.entity'
import { CreateCampaignCDto } from './dtos/CreateCampaign.dto'
import {
  CampaignInput,
  CampaignInputResponse,
  CampaignsInputResponse,
} from './input/campain.input'
import { User } from '../users/entity/user.entity'
import { RedisService } from 'src/common/redis/redis.service'
import { CampaignDto } from './dtos/Campaign.dto'
import { CampaignLoader } from './loader/campaign.loader'
import { InjectModel } from '@nestjs/sequelize'
import { I18nService } from 'nestjs-i18n'
import { Limit, Page } from 'src/common/constant/messages.constant'

@Injectable()
export class CampaignService {
  constructor (
    @InjectModel(Campaign) private campaignRepo: typeof Campaign,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
    private readonly campaignLoader: CampaignLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
  ) {}

  async create (
    createCampaign: CreateCampaignCDto,
    userId: number,
  ): Promise<CampaignInputResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    })
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const transaction = await this.campaignRepo.sequelize.transaction()

    try {
      const campaign = await this.campaignRepo.create(
        {
          ...createCampaign,
          userId,
        },
        { transaction },
      )

      const relationCacheKey = `campaign:${campaign.id}`
      await this.redisService.set(relationCacheKey, campaign)

      this.websocketGateway.broadcast('campaignCreated', {
        campaignId: campaign.id,
        campaign,
      })

      await transaction.commit()

      const data: CampaignInput = {
        ...campaign,
        user,
      }
      return {
        data,
        statusCode: 201,
        message: await this.i18n.t('campaign.CREATED'),
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async getCampainById (id: number): Promise<CampaignInputResponse> {
    const campaign = await this.campaignRepo.findOne({
      where: { id },
    })
    if (!campaign)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUND'))

    const user = await this.userRepo.findOne({
      where: { id: campaign.userId },
    })
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const result: CampaignInputResponse = { data: { ...campaign, user } }

    const relationCacheKey = `campaign:${campaign.id}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getCampaign (
    CampaignDto: CampaignDto,
    page: number = Page,
    limit: number = Limit,
  ): Promise<CampaignsInputResponse> {
    const { rows: data, count: total } =
      await this.campaignRepo.findAndCountAll({
        where: { ...CampaignDto },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      })
    if (data.length == 0)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUNDS'))

    const campaignIds = data.map(campaign => campaign.id)
    const campaigns = await this.campaignLoader.loadMany(campaignIds)

    const items: CampaignInput[] = data.map((c, index) => {
      const campaign = campaigns[index]
      return campaign
    })

    const result: CampaignsInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }
    return result
  }

  async listCampaign (
    page: number = Page,
    limit: number = Limit,
  ): Promise<CampaignsInputResponse> {
    const { rows: data, count: total } =
      await this.campaignRepo.findAndCountAll({
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      })
    if (data.length == 0)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUNDS'))

    const campaignIds = data.map(campaign => campaign.id)
    const campaigns = await this.campaignLoader.loadMany(campaignIds)

    const items: CampaignInput[] = data.map((c, index) => {
      const campaign = campaigns[index]
      return campaign
    })

    const result: CampaignsInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }
    return result
  }

  async updateCampaign (
    id: number,
    updateCampaignDto: CampaignDto,
  ): Promise<CampaignInputResponse> {
    const campaign = (await this.getCampainById(id)).data
    if (!campaign)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUND'))

    const user = await this.userRepo.findOne({
      where: { id: campaign.user.id },
    })
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const result: CampaignInputResponse = { data: { ...campaign, user } }

    await this.campaignRepo.update(updateCampaignDto, {
      where: { id },
      returning: true,
    })

    const relationCacheKey = `campaign:${campaign.id}`
    await this.redisService.set(relationCacheKey, result)

    return {
      message: await this.i18n.t('campaign.UPDATED'),
      data: { user: campaign.user, ...campaign },
    }
  }

  async deleteCampaign (id: number): Promise<CampaignInputResponse> {
    const campaign = await this.campaignRepo.findOne({ where: { id } })
    if (!campaign)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUND'))

    campaign.destroy()

    this.websocketGateway.broadcast('campaignDeleted', {
      campaignId: id,
    })

    return { data: null, message: await this.i18n.t('campaign.DELETED') }
  }
}
