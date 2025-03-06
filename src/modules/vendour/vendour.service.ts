import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Vendor } from './entity/vendour.entity'
import { Banner } from '../banner/entity/bannner.entity'
import { User } from '../users/entity/user.entity'
import { UserInputResponse } from '../users/input/User.input'
import { I18nService } from 'nestjs-i18n'
import { Limit, Page } from 'src/common/constant/messages.constant'
import { VendorLoader } from './loader/vendor.loader'
import { Campaign } from '../campaign/entity/campaign.entity'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import {
  VendorInput,
  VendorInputResponse,
  VendorsInputResponse,
} from './input/vendour.input'

@Injectable()
export class VendorService {
  constructor (
    private readonly i18n: I18nService,
    private readonly vendorLoader: VendorLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    @InjectModel(User) private userRepo: typeof User,
    @InjectModel(Banner) private bannerRepo: typeof Banner,
    @InjectModel(Vendor) private vendorRepo: typeof Vendor,
    @InjectModel(Campaign) private campaignRepo: typeof Campaign,
  ) {}

  async create (
    bannerId: number,
    userId: number,
    campaignId: number,
  ): Promise<VendorInputResponse> {
    const user = await (
      await this.userRepo.findOne({ where: { id: userId } })
    )?.dataValues
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const campaign = await (
      await this.campaignRepo.findByPk(campaignId)
    )?.dataValues
    if (!campaign)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUND'))

    const banner = await (await this.bannerRepo.findByPk(bannerId))?.dataValues
    if (!banner)
      throw new NotFoundException(await this.i18n.t('banner.NOT_FOUND'))

    const vendor = await this.vendorRepo.create({
      bannerId,
      campaignId,
      userId,
    })

    const result: VendorInputResponse = {
      statusCode: 201,
      message: await this.i18n.t('vendor.CREATED'),
      data: {
        ...vendor.dataValues,
        campaign,
        user,
        banner,
      },
    }

    const relationCacheKey = `vendor:${vendor.id}`
    await this.redisService.set(relationCacheKey, result)

    this.websocketGateway.broadcast('vendorCreated', {
      vendorId: vendor.id,
    })

    return result
  }

  async getById (id: number): Promise<VendorInputResponse> {
    const vendor = await (
      await this.vendorRepo.findOne({ where: { id } })
    )?.dataValues
    if (!vendor)
      throw new NotFoundException(await this.i18n.t('vendor.NOT_FOUND'))

    const user = (await this.userRepo.findByPk(vendor.userId))?.dataValues
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const campaign = await (
      await this.campaignRepo.findByPk(vendor.campaignId)
    )?.dataValues
    if (!campaign)
      throw new NotFoundException(await this.i18n.t('campaign.NOT_FOUND'))

    const banner = await (
      await this.bannerRepo.findByPk(vendor.bannerId)
    )?.dataValues
    if (!banner)
      throw new NotFoundException(await this.i18n.t('banner.NOT_FOUND'))

    const result: VendorInputResponse = {
      data: { ...vendor, user, campaign, banner },
    }

    const relationCacheKey = `vendor:${vendor.id}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getBannerVendor (bannerId: number): Promise<UserInputResponse> {
    const banner = await this.bannerRepo.findByPk(bannerId)
    if (!banner)
      throw new NotFoundException(await this.i18n.t('banner.NOT_FOUND'))

    const vendor = await this.vendorRepo.findOne({ where: { bannerId } })
    if (!vendor)
      throw new NotFoundException(await this.i18n.t('vendor.NOT_FOUND'))

    const user = await this.userRepo.findByPk(vendor.userId)
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const result: UserInputResponse = {
      data: user.dataValues,
    }

    const relationCacheKey = `banner-vendor:${bannerId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getUserVendor (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<VendorsInputResponse> {
    const user = await this.userRepo.findByPk(userId)
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const { rows: data, count: total } = await this.vendorRepo.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })
    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('vendor.NOT_FOUNDS'))

    const vendorsIds = data.map(vendor => vendor.id)
    const vendors = await this.vendorLoader.loadMany(vendorsIds)

    const items: VendorInput[] = data.map((p, index) => {
      const vendor = vendors[index]
      if (!vendor) throw new NotFoundException(this.i18n.t('vendor.NOT_FOUND'))

      return vendor
    })

    const result = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    const relationCacheKey = `user-vendor:${userId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async get (
    page: number = Page,
    limit: number = Limit,
  ): Promise<VendorsInputResponse> {
    const { rows: data, count: total } = await this.vendorRepo.findAndCountAll({
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })
    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('vendor.NOT_FOUNDS'))

    const vendorsIds = data.map(vendor => vendor.id)
    const vendors = await this.vendorLoader.loadMany(vendorsIds)

    const items: VendorInput[] = data.map((p, index) => {
      const vendor = vendors[index]
      if (!vendor) throw new NotFoundException(this.i18n.t('vendor.NOT_FOUND'))

      return vendor
    })

    return {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async delete (id: number): Promise<VendorInputResponse> {
    const vendor = await this.vendorRepo.findByPk(id)
    if (!vendor)
      throw new NotFoundException(await this.i18n.t('vendor.NOT_FOUND'))

    await this.vendorRepo.destroy({ where: { id } })

    const relationCacheKey = `vendor:${vendor.id}`
    await this.redisService.del(relationCacheKey)

    this.websocketGateway.broadcast('vendorDeleted', {
      vendorId: vendor.id,
    })

    return {
      message: await this.i18n.t('vendor.DELETED'),
      data: null,
    }
  }
}
