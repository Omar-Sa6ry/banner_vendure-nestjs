import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { BuyerInput } from '../input/buyer.input'
import { Buyer } from '../entity/buyer.entity'
import { Banner } from 'src/modules/banner/entity/bannner.entity'

@Injectable()
export class BuyerLoader {
  private loader: DataLoader<number, BuyerInput>

  constructor (
    @InjectModel(Buyer) private buyerRepo: typeof Buyer,
    @InjectModel(User) private userRepo: typeof User,
    @InjectModel(Banner) private bannerRepo: typeof Banner,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, BuyerInput>(async (keys: number[]) => {
      const buyers = await this.buyerRepo.findAll({
        where: { id: { [Op.in]: keys } },
      })

      const userIds = [...new Set(buyers.map(buyer => buyer.userId))]
      const users = await this.userRepo.findAll({
        where: { id: { [Op.in]: userIds } },
      })
      const userMap = new Map(users.map(user => [user.id, user]))

      const bannerIds = [...new Set(buyers.map(buyer => buyer.bannerId))]
      const banners = await this.bannerRepo.findAll({
        where: { id: { [Op.in]: bannerIds } },
      })
      const bannerMap = new Map(banners.map(banner => [banner.id, banner]))

      return keys.map(key => {
        const buyer = buyers.find(c => c.id === key).dataValues
        if (!buyer) throw new NotFoundException(this.i18n.t('buyer.NOT_FOUND'))

        const user = userMap.get(buyer.userId).dataValues
        if (!user) throw new NotFoundException(this.i18n.t('user.NOT_FOUND'))

        const banner = bannerMap.get(buyer.bannerId).dataValues
        if (!banner)
          throw new NotFoundException(this.i18n.t('banner.NOT_FOUND'))

        return { ...buyer, user, banner }
      })
    })
  }

  load (id: number): Promise<BuyerInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<BuyerInput[]> {
    const results = await this.loader.loadMany(ids)

    return results.filter(result => !(result instanceof Error)) as BuyerInput[]
  }
}
