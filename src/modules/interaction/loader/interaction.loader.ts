import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { User } from 'src/modules/users/entity/user.entity'
import { Interaction } from '../entity/interaction.entity'
import { InteractionInput } from '../input/interaction.input'
import { Banner } from 'src/modules/banner/entity/bannner.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { InterActionType } from 'src/common/constant/enum.constant'

@Injectable()
export class InteractionLoader {
  private loader: DataLoader<number, InteractionInput>

  constructor (
    @InjectModel(Banner) private bannerRepo: typeof Banner,
    @InjectModel(User) private userRepo: typeof User,
    @InjectModel(Campaign) private campaignRepo: typeof Campaign,
    @InjectModel(Interaction) private interactionRepo: typeof Interaction,
  ) {
    this.loader = new DataLoader<number, InteractionInput>(
      async (keys: number[]) => {
        const interactions = await this.interactionRepo.findAll({
          where: { id: { [Op.in]: keys } },
        })
        const interactionMap = new Map(interactions.map(i => [i.id, i]))

        const userIds = [...new Set(interactions.map(i => i.userId))]
        const users = await this.userRepo.findAll({
          where: { id: { [Op.in]: userIds } },
        })
        const userMap = new Map(users.map(user => [user.id, user]))

        const bannerIds = [...new Set(interactions.map(i => i.bannerId))]
        const banners = await this.bannerRepo.findAll({
          where: { id: { [Op.in]: bannerIds } },
        })
        const bannerMap = new Map(banners.map(banner => [banner.id, banner]))

        const campaignIds = [...new Set(banners.map(i => i.campaignId))]
        const campaigns = await this.campaignRepo.findAll({
          where: { id: { [Op.in]: campaignIds } },
        })
        const campaignMap = new Map(
          campaigns.map(campaign => [campaign.id, campaign]),
        )

        const createdByIds = [...new Set(banners.map(i => i.createdBy))]
        const createdBys = await this.userRepo.findAll({
          where: { id: { [Op.in]: createdByIds } },
        })
        const createdByMap = new Map(
          createdBys.map(createdBy => [createdBy.id, createdBy]),
        )

        const interactionsOfBanner = await this.interactionRepo.findAll({
          where: { bannerId: { [Op.in]: bannerIds } },
          raw: true,
        })

        const viewsMap = new Map<number, number>()
        const clicksMap = new Map<number, number>()

        interactionsOfBanner.forEach(interaction => {
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

        return keys.map(id => {
          const interaction = interactionMap.get(id)
          if (!interaction)
            throw new NotFoundException(`Interaction with ID ${id} not found`)

          const banner = bannerMap.get(interaction.bannerId)
          const views = viewsMap.get(banner.id)
          const clicks = clicksMap.get(banner.id)
          const createdBy = createdByMap.get(banner.createdBy)
          const campaign = campaignMap.get(banner.campaignId)
          const user = userMap.get(interaction.userId)

          const result: InteractionInput = {
            ...interaction,
            banner: {
              ...banner,
              views,
              clicks,
              createdBy,
              campaign,
            },
            user,
          }

          return result
        })
      },
    )
  }

  load (id: number): Promise<InteractionInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<InteractionInput[]> {
    const results = await this.loader.loadMany(ids)
    return results.filter(
      (result): result is InteractionInput => !(result instanceof Error),
    )
  }
}
