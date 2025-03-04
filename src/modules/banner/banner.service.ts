import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { UploadService } from './../../common/upload/upload.service'
import { InjectModel } from '@nestjs/sequelize'
import { Partner } from 'src/modules/partner/entity/partner.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Banner } from './entity/bannner.entity'
import { CreateImagDto } from 'src/common/upload/dtos/createImage.dto'
import { InteractionService } from '../interaction/interaction.service'
import { CreateBannerDto } from './dtos/CreateBanner.dto'
import { User } from '../users/entity/user.entity'
import { I18nService } from 'nestjs-i18n'
import { CampaignService } from '../campaign/campaign.service'
import { InterActionType, Role } from 'src/common/constant/enum.constant'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { UpdateBannerDto } from './dtos/UpdateBanner.dto'
import { Limit, Page } from 'src/common/constant/messages.constant'
import { BannerLoader } from './loader/banner.loader'
import {
  BannerInput,
  BannerInputResponse,
  BannersInputResponse,
} from './input/banner.input'

@Injectable()
export class BannerService {
  constructor (
    @InjectModel(Banner) private bannerRepo: typeof Banner,
    @InjectModel(User) private userRepo: typeof User,
    @InjectModel(Partner) private partnerRepo: typeof Partner,
    @InjectModel(Campaign) private campaignRepo: typeof Campaign,
    private readonly i18n: I18nService,
    private readonly bannerLoader: BannerLoader,
    private readonly uploadService: UploadService,
    private readonly interactionService: InteractionService,
    private readonly campaignService: CampaignService,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
  ) {}

  async create (
    userId: number,
    createBannerDto: CreateBannerDto,
    imageAr: CreateImagDto,
    imageEn: CreateImagDto,
  ): Promise<BannerInputResponse> {
    const user = await this.userRepo.findByPk(userId)
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))
    if (user.role !== Role.PARTNER) {
      throw new BadRequestException(await this.i18n.t('user.ROLE'))
    }

    const campaign = await (
      await this.campaignService.getCampainById(createBannerDto.campaignId)
    )?.data
    if (!campaign)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUND'))

    const partner = await this.partnerRepo.findOne({
      where: { campaignId: campaign.id, userId },
    })
    if (!partner)
      throw new NotFoundException(await this.i18n.t('partner.NOT_FOUND'))

    const image_ar = await this.uploadService.uploadImage(imageAr)
    const image_en = await this.uploadService.uploadImage(imageEn)

    const transaction = await this.bannerRepo.sequelize.transaction()

    try {
      const banner = await this.bannerRepo.create(
        {
          ...createBannerDto,
          createdBy: userId,
          image_ar,
          image_en,
        },
        { transaction },
      )

      const data: BannerInput = {
        ...banner,
        views: 0,
        clicks: 0,
        createdBy: user,
        campaign,
      }

      const result: BannerInputResponse = {
        data,
        statusCode: 201,
        message: await this.i18n.t('banner.CREATED'),
      }

      const relationCacheKey = `banner:${banner.id}`
      await this.redisService.set(relationCacheKey, result)

      this.websocketGateway.broadcast('bannerCreated', {
        bannerId: banner.id,
        banner,
      })

      return result
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async getById (id: number, userId?: number): Promise<BannerInputResponse> {
    const banner = await this.bannerRepo.findByPk(id)
    if (!banner)
      throw new NotFoundException(await this.i18n.t('banner.NOT_FOUND'))

    const user = await this.userRepo.findByPk(banner.createdBy)
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))
    if (user.role !== Role.PARTNER) {
      throw new BadRequestException(await this.i18n.t('user.ROLE'))
    }

    const campaign = await (
      await this.campaignService.getCampainById(banner.campaignId)
    )?.data
    if (!campaign)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUND'))

    if (userId) {
      await this.interactionService.create(userId, {
        type: InterActionType.CLICK,
        bannerId: banner.id,
      })
    }
    const views = +(await this.interactionService.countView(banner.id))?.message
    const clicks = +(await this.interactionService.countClick(banner.id))
      ?.message

    const result: BannerInputResponse = {
      data: { ...banner, views, clicks, campaign, createdBy: user },
    }

    const relationCacheKey = `banner:${banner.id}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getByCampaign (
    userId: number,
    campaignId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<BannersInputResponse> {
    const campaign = await this.campaignRepo.findByPk(campaignId)
    if (!campaign)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUND'))

    const { rows: data, count: total } = await this.bannerRepo.findAndCountAll({
      where: { campaignId },
      order: [['score', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })
    if (data.length == 0)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUNDS'))

    const bannerIds = data.map(banner => banner.id)
    const banners = await this.bannerLoader.loadMany(userId, bannerIds)

    const items: BannerInput[] = data.map((c, index) => {
      const banner = banners[index]
      return banner
    })

    const result: BannersInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    const relationCacheKey = `banner-campaign:${campaignId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async get (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<BannersInputResponse> {
    const { rows: data, count: total } = await this.bannerRepo.findAndCountAll({
      order: [['score', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })
    if (data.length == 0)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUNDS'))

    const bannerIds = data.map(banner => banner.id)
    const banners = await this.bannerLoader.loadMany(userId, bannerIds)

    const items: BannerInput[] = data.map((c, index) => {
      const banner = banners[index]
      return banner
    })

    const result: BannersInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    return result
  }

  async update (
    id: number,
    userId: number,
    campaignId: number,
    updateBannerDto: UpdateBannerDto,
  ): Promise<BannerInputResponse> {
    const campaign = await this.campaignRepo.findByPk(campaignId)
    if (!campaign)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUND'))

    const partner = await this.partnerRepo.findOne({
      where: { campaignId, userId },
    })
    if (!partner)
      throw new NotFoundException(await this.i18n.t('partner.NOT_PARTNER'))

    const [updated] = await this.bannerRepo.update(updateBannerDto, {
      where: { id },
      returning: true,
    })

    if (!updated)
      throw new NotFoundException(await this.i18n.t('banner.NOT_FOUND'))

    this.websocketGateway.broadcast('bannerUpdated', {
      bannerId: id,
    })

    return await this.getById(id)
  }

  async delete (
    id: number,
    userId: number,
    campaignId: number,
  ): Promise<BannerInputResponse> {
    const campaign = await this.campaignRepo.findByPk(campaignId)
    if (!campaign)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUND'))

    const partner = await this.partnerRepo.findOne({
      where: { userId, campaignId },
    })
    if (!partner)
      throw new NotFoundException(await this.i18n.t('partner.NOT_PARTNER'))

    const deleted = await this.bannerRepo.destroy({
      where: { id },
    })

    if (!deleted)
      throw new NotFoundException(await this.i18n.t('banner.NOT_FOUND'))

    const relationCacheKey = `banner:${id}`
    await this.redisService.set(relationCacheKey, null)

    this.websocketGateway.broadcast('bannerDeleted', {
      bannerId: id,
    })

    return { data: null, message: await this.i18n.t('banner.DELETED') }
  }
}
