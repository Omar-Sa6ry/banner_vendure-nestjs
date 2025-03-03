import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { BannerInput } from '../input/banner.input'
import { Banner } from '../entity/bannner.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Interaction } from 'src/modules/interaction/entity/interaction.entity'
import { InterActionType } from 'src/common/constant/enum.constant'

@Injectable()
export class BannerLoader {
  private loader: DataLoader<{ bannerId: number; userId: number }, BannerInput>

  constructor (
    @InjectModel(Banner) private bannerRepo: typeof Banner,
    @InjectModel(Interaction) private interactionRepo: typeof Interaction,
    @InjectModel(Campaign) private campaignRepo: typeof Campaign,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<
      { bannerId: number; userId: number },
      BannerInput
    >(async keys => {
      const bannerIds = keys.map(key => key.bannerId)
      const userId = keys[0].userId

      const banners = await this.bannerRepo.findAll({
        where: { id: { [Op.in]: bannerIds } },
      })

      const interactionsToInsert = bannerIds.map(bannerId => ({
        type: InterActionType.VIEW,
        bannerId,
        userId,
      }))

      await this.interactionRepo.bulkCreate(interactionsToInsert)

      const interactions = await this.interactionRepo.findAll({
        where: { bannerId: { [Op.in]: bannerIds } },
        raw: true,
      })

      const viewsMap = new Map<number, number>()
      const clicksMap = new Map<number, number>()

      interactions.forEach(interaction => {
        if (interaction.type === InterActionType.VIEW) {
          viewsMap.set(
            interaction.bannerId,
            viewsMap.get(interaction.bannerId) || 0,
          )
        } else {
          clicksMap.set(
            interaction.bannerId,
            clicksMap.get(interaction.bannerId) || 0,
          )
        }
      })

      const userIds = [...new Set(banners.map(Banner => Banner.createdBy))]
      const users = await this.userRepo.findAll({
        where: { id: { [Op.in]: userIds } },
      })
      const userMap = new Map(users.map(user => [user.id, user]))

      const campaignIds = [...new Set(banners.map(Banner => Banner.campaignId))]
      const campaigns = await this.campaignRepo.findAll({
        where: { id: { [Op.in]: campaignIds } },
      })
      const campaignMap = new Map(
        campaigns.map(campaign => [campaign.id, campaign]),
      )

      return bannerIds.map(key => {
        const banner = banners.find(c => c.id === key)
        if (!banner)
          throw new NotFoundException(this.i18n.t('banner.NOT_FOUND'))

        const views = viewsMap.get(banner.id)
        const clicks = clicksMap.get(banner.id)

        const user = userMap.get(banner.createdBy)
        if (!user) throw new NotFoundException(this.i18n.t('user.NOT_FOUND'))

        const campaign = campaignMap.get(banner.campaignId)
        if (!campaign)
          throw new NotFoundException(this.i18n.t('campaign.NOT_FOUND'))

        const result: BannerInput = {
          ...banner,
          views,
          clicks,
          createdBy: user,
          campaign,
        }
        return result
      })
    })
  }

  load (bannerId: number, userId: number): Promise<BannerInput> {
    return this.loader.load({ bannerId, userId })
  }

  async loadMany (userId: number, bannerIds: number[]): Promise<BannerInput[]> {
    const keys = bannerIds.map(bannerId => ({ bannerId, userId }))
    const results = await this.loader.loadMany(keys)
    return results.filter(result => !(result instanceof Error)) as BannerInput[]
  }
}
