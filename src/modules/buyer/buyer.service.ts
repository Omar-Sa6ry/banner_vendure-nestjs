import Stripe from 'stripe'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Buyer } from './entity/buyer.entity'
import { Banner } from '../banner/entity/bannner.entity'
import { User } from '../users/entity/user.entity'
import { NotificationService } from 'src/common/queues/notification/notification.service'
import { CreateBuyerInputResponse } from './input/createBuyer.input'
import { BuyerLoader } from './loader/buyer.loader'
import { Limit, Page } from 'src/common/constant/messages.constant'
import { I18nService } from 'nestjs-i18n'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import {
  BuyerInput,
  BuyerInputResponse,
  BuyersInputResponse,
} from './input/buyer.input'

@Injectable()
export class BuyerService {
  private stripe: Stripe

  constructor (
    @InjectModel(Buyer) private buyerRepo: typeof Buyer,
    @InjectModel(Banner) private bannerRepo: typeof Banner,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
    private readonly buyerLoader: BuyerLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    private readonly notificationService: NotificationService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }

  async create (
    bannerId: number,
    userId: number,
  ): Promise<CreateBuyerInputResponse> {
    const transaction = await this.buyerRepo.sequelize.transaction()

    try {
      const user = await this.userRepo.findByPk(userId)
      if (!user)
        throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

      const banner = await this.bannerRepo.findByPk(bannerId)
      if (!banner)
        throw new NotFoundException(await this.i18n.t('banner.NOT_FOUND'))

      const buyer = await this.buyerRepo.create(
        {
          bannerId,
          userId,
          amount: banner.price,
          paymentMethod: 'card',
        },
        { transaction },
      )

      const lineItems = [
        {
          price_data: {
            currency: 'egp',
            unit_amount: banner.price * 100,
            product_data: {
              name: `${banner.dataValues.page} &${banner.dataValues.position}`,
            },
          },
          quantity: 1,
        },
      ]

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: process.env.SUCCESSURL,
        cancel_url: process.env.FAILURL,
        client_reference_id: `${userId}`,
        customer_email: user.email,
      })

      const data: BuyerInputResponse = {
        message: await this.i18n.t('user.CREATED'),
        statusCode: 201,
        data: {
          ...buyer.get({ plain: true }),
          banner: banner.get({ plain: true }),
          user: user.get({ plain: true }),
        },
      }

      const result: CreateBuyerInputResponse = {
        message: await this.i18n.t('user.CREATED'),
        statusCode: 201,
        data: {
          ...buyer.get({ plain: true }),
          session: session.url,
          banner: banner.get({ plain: true }),
          user: user.get({ plain: true }),
        },
      }

      const relationCacheKey = `buyer:${buyer.id}`
      await this.redisService.set(relationCacheKey, data)

      this.websocketGateway.broadcast('buyerCreated', {
        buyerId: buyer.id,
      })

      await transaction.commit()

      return result
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async findOne (id: number): Promise<BuyerInputResponse> {
    const buyer = await (await this.buyerRepo.findByPk(id))?.dataValues
    if (!buyer)
      throw new NotFoundException(await this.i18n.t('buyer.NOT_FOUND'))

    const user = await (await this.userRepo.findByPk(buyer.userId))?.dataValues
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const banner = await (
      await this.bannerRepo.findByPk(buyer.bannerId)
    )?.dataValues
    if (!banner)
      throw new NotFoundException(await this.i18n.t('banner.NOT_FOUND'))

    const result: BuyerInputResponse = {
      data: {
        ...buyer,
        banner,
        user,
      },
    }

    const relationCacheKey = `buyer:${buyer.id}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async delete (id: number): Promise<BuyerInputResponse> {
    const buyer = await this.buyerRepo.findByPk(id)
    if (!buyer)
      throw new NotFoundException(await this.i18n.t('buyer.NOT_FOUND'))

    await buyer.destroy()

    const relationCacheKey = `buyer:${buyer.id}`
    await this.redisService.set(relationCacheKey, null)

    this.websocketGateway.broadcast('buyerDeleted', {
      buyerId: buyer.id,
    })

    return { data: null, message: await this.i18n.t('buyer.DELETED') }
  }

  async findAll (
    page: number = Page,
    limit: number = Limit,
  ): Promise<BuyersInputResponse> {
    const { rows: data, count: total } = await this.buyerRepo.findAndCountAll({
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })
    if (data.length == 0)
      throw new NotFoundException(await this.i18n.t('buyer.NOT_FOUNDS'))

    const buyerIds = data.map(buyer => buyer.id)
    const buyers = await this.buyerLoader.loadMany(buyerIds)

    const items: BuyerInput[] = data.map((c, index) => {
      const buyer = buyers[index]
      return buyer
    })

    const result: BuyersInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    return result
  }

  async findByBannerId (
    bannerId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<BuyersInputResponse> {
    const { rows: data, count: total } = await this.buyerRepo.findAndCountAll({
      where: { bannerId },
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })
    if (data.length == 0)
      throw new NotFoundException(await this.i18n.t('buyer.NOT_FOUNDS'))

    const buyerIds = data.map(buyer => buyer.id)
    const buyers = await this.buyerLoader.loadMany(buyerIds)

    const items: BuyerInput[] = data.map((c, index) => {
      const buyer = buyers[index]
      return buyer
    })

    const result: BuyersInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    const relationCacheKey = `buyer-banner:${bannerId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async findByUserId (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<BuyersInputResponse> {
    const { rows: data, count: total } = await this.buyerRepo.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })
    if (data.length == 0)
      throw new NotFoundException(await this.i18n.t('buyer.NOT_FOUNDS'))

    const buyerIds = data.map(buyer => buyer.id)
    const buyers = await this.buyerLoader.loadMany(buyerIds)

    const items: BuyerInput[] = data.map((c, index) => {
      const buyer = buyers[index]
      return buyer
    })

    const result: BuyersInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    const relationCacheKey = `buyer-user:${userId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }
}
