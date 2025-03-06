import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { Vendor } from '../entity/vendour.entity'
import { Banner } from 'src/modules/banner/entity/bannner.entity'
import { VendorInput } from '../input/vendour.input'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'

@Injectable()
export class VendorLoader {
  private loader: DataLoader<number, VendorInput>

  constructor (
    @InjectModel(Vendor) private vendorRepo: typeof Vendor,
    @InjectModel(Campaign) private campaignRepo: typeof Campaign,
    @InjectModel(Banner) private bannerRepo: typeof Banner,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, VendorInput>(
      async (keys: number[]) => {
        const Vendors = await this.vendorRepo.findAll({
          where: { id: { [Op.in]: keys } },
        })

        const userIds = [...new Set(Vendors.map(Vendor => Vendor.userId))]
        const users = await this.userRepo.findAll({
          where: { id: { [Op.in]: userIds } },
        })
        const userMap = new Map(users.map(user => [user.id, user]))

        const campaignIds = [
          ...new Set(Vendors.map(Vendor => Vendor.campaignId)),
        ]
        const campaigns = await this.campaignRepo.findAll({
          where: { id: { [Op.in]: campaignIds } },
        })
        const campaignMap = new Map(
          campaigns.map(campaign => [campaign.id, campaign]),
        )

        const bannerIds = [...new Set(Vendors.map(Vendor => Vendor.bannerId))]
        const banners = await this.bannerRepo.findAll({
          where: { id: { [Op.in]: bannerIds } },
        })
        const bannerMap = new Map(banners.map(banner => [banner.id, banner]))

        return keys.map(key => {
          const vendor = Vendors.find(c => c.id === key)?.dataValues
          if (!vendor)
            throw new NotFoundException(this.i18n.t('vendor.NOT_FOUND'))

          const user = userMap.get(vendor.userId).dataValues
          if (!user) throw new NotFoundException(this.i18n.t('user.NOT_FOUND'))

          const campaign = campaignMap.get(vendor.campaignId).dataValues
          if (!campaign)
            throw new NotFoundException(this.i18n.t('user.NOT_FOUND'))

          const banner = bannerMap.get(vendor.bannerId).dataValues
          if (!banner)
            throw new NotFoundException(this.i18n.t('user.NOT_FOUND'))

          return { ...vendor, campaign, banner, user }
        })
      },
    )
  }

  load (id: number): Promise<VendorInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<VendorInput[]> {
    const results = await this.loader.loadMany(ids)

    return results.filter(result => !(result instanceof Error)) as VendorInput[]
  }
}
