import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { CampaignInput } from '../inputs/campain.input'
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'

@Injectable()
export class CampaignLoader {
  private loader: DataLoader<number, CampaignInput>

  constructor (
    @InjectModel(Campaign) private campaignRepo: typeof Campaign,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, CampaignInput>(
      async (keys: number[]) => {
        const campaigns = await this.campaignRepo.findAll({
          where: { id: { [Op.in]: keys } },
        })

        const userIds = [...new Set(campaigns.map(campaign => campaign.userId))]
        const users = await this.userRepo.findAll({
          where: { campaignId: { [Op.in]: keys } },
        })
        const userMap = new Map(users.map(user => [user.id, user]))

        return keys.map(key => {
          const campaign = campaigns.find(c => c.id === key)
          if (!campaign)
            throw new NotFoundException(this.i18n.t('campaign.NOT_FOUND'))

          const user = userMap.get(campaign.userId)
          if (!user) throw new NotFoundException(this.i18n.t('user.NOT_FOUND'))

          return { ...campaign, user }
        })
      },
    )
  }

  load (id: number): Promise<CampaignInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<CampaignInput[]> {
    const results = await this.loader.loadMany(ids)

    return results.filter(
      result => !(result instanceof Error),
    ) as CampaignInput[]
  }
}
