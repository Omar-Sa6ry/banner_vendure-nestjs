import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Partner } from './entity/partner.entity'
import { Campaign } from '../campaign/entity/campaign.entity'
import { Role } from 'src/common/constant/enum.constant'
import { User } from '../users/entity/user.entity'
import { I18nService } from 'nestjs-i18n'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { RedisService } from 'src/common/redis/redis.service'
import { Limit, Page } from 'src/common/constant/messages.constant'
import { PartnerLoader } from './loader/partner.loader'
import {
  partnerInput,
  PartnerInputResponse,
  PartnersInputResponse,
} from './input/partner.input'

@Injectable()
export class PartnerService {
  constructor (
    @InjectModel(Partner) private partnerRepo: typeof Partner,
    @InjectModel(Campaign) private campaignRepo: typeof Campaign,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
    private readonly partnerLoader: PartnerLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
  ) {}

  async add (campaignId: number, userId: number): Promise<PartnerInputResponse> {
    const campaign = (await this.campaignRepo.findByPk(campaignId))?.dataValues
    if (!campaign)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUND'))

    const user = await (await this.userRepo.findByPk(userId))?.dataValues
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const transaction = await this.campaignRepo.sequelize.transaction()

    try {
      const partner = await this.partnerRepo.create(
        {
          campaignId,
          userId,
        },
        { transaction },
      )
      user.role = Role.PARTNER
      user.save()
      partner.save()

      const data: partnerInput = { ...partner.dataValues, user, campaign }

      const relationCacheKey = `partner:${partner.id}`
      await this.redisService.set(relationCacheKey, data)

      this.websocketGateway.broadcast('partnerCreated', {
        partnerId: partner.id,
        partner,
      })

      await transaction.commit()

      return {
        data,
        statusCode: 201,
        message: await this.i18n.t('partner.CREATED'),
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async getById (id: number): Promise<PartnerInputResponse> {
    const partner = await this.partnerRepo.findByPk(id)
    if (!partner)
      throw new NotFoundException(await this.i18n.t('partner.NOT_FOUND'))

    const campaign = await this.campaignRepo.findByPk(partner.campaignId)
    if (!campaign)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUND'))

    const user = await this.userRepo.findByPk(partner.userId)
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const data: partnerInput = {
      ...partner.dataValues,
      user: user.dataValues,
      campaign: campaign.dataValues,
    }

    const relationCacheKey = `partner:${partner.id}`
    await this.redisService.set(relationCacheKey, data)

    return {
      data,
      statusCode: 201,
    }
  }

  async getpartnersByCampaign (
    campaignId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<PartnersInputResponse> {
    const { rows: data, count: total } = await this.partnerRepo.findAndCountAll(
      {
        where: { campaignId },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      },
    )

    if (data.length == 0)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUNDS'))

    const partnerIds = data.map(partner => partner.id)
    const partners = await this.partnerLoader.loadMany(partnerIds)

    const items: partnerInput[] = data.map((c, index) => {
      const partner = partners[index]
      return partner
    })

    const result: PartnersInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    const relationCacheKey = `partner-campaign:${campaignId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getPartnersByUser (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<PartnersInputResponse> {
    const { rows: data, count: total } = await this.partnerRepo.findAndCountAll(
      {
        where: { userId },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      },
    )

    if (data.length == 0)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUNDS'))

    const partnerIds = data.map(partner => partner.id)
    const partners = await this.partnerLoader.loadMany(partnerIds)

    const items: partnerInput[] = data.map((c, index) => {
      const partner = partners[index]
      return partner
    })

    const result: PartnersInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    const relationCacheKey = `partner-user:${userId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async delete (id: number): Promise<PartnerInputResponse> {
    const partner = await this.partnerRepo.findByPk(id)
    if (!partner)
      throw new NotFoundException(await this.i18n.t('partner.NOT_FOUND'))

    partner.destroy()

    const relationCacheKey = `partner:${partner.id}`
    await this.redisService.set(relationCacheKey, null)

    this.websocketGateway.broadcast('partnerDeleted', {
      partnerId: partner.id,
      partner,
    })

    return { message: await this.i18n.t('campaign.DELETED'), data: null }
  }
}
