import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { Partner } from '../entity/partner.entity'
import { partnerInput } from '../input/partner.input'

@Injectable()
export class PartnerLoader {
  private loader: DataLoader<number, partnerInput>

  constructor (
    @InjectModel(Campaign) private campaignRepo: typeof Campaign,
    @InjectModel(Partner) private partnerRepo: typeof Partner,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, partnerInput>(
      async (keys: number[]) => {
        const partners = await this.partnerRepo.findAll({
          where: { id: { [Op.in]: keys } },
        })

        const userIds = [...new Set(partners.map(partner => partner.userId))]
        const users = await this.userRepo.findAll({
          where: { id: { [Op.in]: userIds } },
        })
        const userMap = new Map(users.map(user => [user.id, user]))

        const campaignIds = [
          ...new Set(partners.map(partner => partner.campaignId)),
        ]
        const campaigns = await this.campaignRepo.findAll({
          where: { id: { [Op.in]: campaignIds } },
        })
        const campaignMap = new Map(
          campaigns.map(campaign => [campaign.id, campaign]),
        )

        return keys.map(key => {
          const partner = partners.find(c => c.id === key)
          if (!partner)
            throw new NotFoundException(this.i18n.t('partner.NOT_FOUND'))

          const user = userMap.get(partner.userId)?.dataValues
          if (!user) throw new NotFoundException(this.i18n.t('user.NOT_FOUND'))

          const campaign = campaignMap.get(partner.campaignId)?.dataValues
          if (!campaign)
            throw new NotFoundException(this.i18n.t('campaign.NOT_FOUND'))

          return { ...partner.dataValues, user, campaign }
        })
      },
    )
  }

  load (id: number): Promise<partnerInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<partnerInput[]> {
    const results = await this.loader.loadMany(ids)

    return results.filter(
      result => !(result instanceof Error),
    ) as partnerInput[]
  }
}
