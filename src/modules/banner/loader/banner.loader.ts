import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { BannerInput } from '../input/banner.input'
import { Banner } from '../entity/bannner.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'

@Injectable()
export class BannerLoader {
  private loader: DataLoader<number, BannerInput>

  constructor (
    @InjectModel(Banner) private bannerRepo: typeof Banner,
    @InjectModel(Campaign) private campaignRepo: typeof Campaign,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, BannerInput>(
      async (keys: number[]) => {
        const Banners = await this.bannerRepo.findAll({
          where: { id: { [Op.in]: keys } },
        })

        const userIds = [...new Set(Banners.map(Banner => Banner.createdBy))]
        const users = await this.userRepo.findAll({
          where: { id: { [Op.in]: userIds } },
        })
        const userMap = new Map(users.map(user => [user.id, user]))

        const campaignIds = [
          ...new Set(Banners.map(Banner => Banner.campaignId)),
        ]
        const campaigns = await this.campaignRepo.findAll({
          where: { id: { [Op.in]: campaignIds } },
        })
        const campaignMap = new Map(
          campaigns.map(campaign => [campaign.id, campaign]),
        )

        return keys.map(key => {
          const banner = Banners.find(c => c.id === key)
          if (!banner)
            throw new NotFoundException(this.i18n.t('banner.NOT_FOUND'))

          const user = userMap.get(banner.createdBy)
          if (!user) throw new NotFoundException(this.i18n.t('user.NOT_FOUND'))

          const campaign = campaignMap.get(banner.campaignId)
          if (!campaign)
            throw new NotFoundException(this.i18n.t('campaign.NOT_FOUND'))

          const result: BannerInput = { ...banner, createdBy: user, campaign }
          return result
        })
      },
    )
  }

  load (id: number): Promise<BannerInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<BannerInput[]> {
    const results = await this.loader.loadMany(ids)

    return results.filter(result => !(result instanceof Error)) as BannerInput[]
  }
}
