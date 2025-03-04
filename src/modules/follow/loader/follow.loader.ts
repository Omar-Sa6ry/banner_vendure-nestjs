import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { Follow } from 'src/modules/Follow/entity/Follow.entity'
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { FollowInput } from '../input/follow.input'

@Injectable()
export class FollowLoader {
  private loader: DataLoader<number, FollowInput>

  constructor (
    @InjectModel(Follow) private FollowRepo: typeof Follow,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, FollowInput>(
      async (keys: number[]) => {
        const follows = await this.FollowRepo.findAll({
          where: { id: { [Op.in]: keys } },
        })

        const userIds = [
          ...new Set(follows.map(follow => follow.followerId)),
          ...new Set(follows.map(follow => follow.followingId)),
        ]
        const users = await this.userRepo.findAll({
          where: { FollowId: { [Op.in]: userIds } },
        })
        const userMap = new Map(users.map(user => [user.id, user]))

        return keys.map(key => {
          const follow = follows.find(c => c.id === key)
          if (!follow)
            throw new NotFoundException(this.i18n.t('follow.NOT_FOUND'))

          const follower = userMap.get(follow.followerId)
          if (!follower)
            throw new NotFoundException(this.i18n.t('follow.NOT_FOUNDER'))

          const following = userMap.get(follow.followingId)
          if (!following)
            throw new NotFoundException(this.i18n.t('follow.NOT_FOUNDER'))

          return { ...follow, follower, following }
        })
      },
    )
  }

  load (id: number): Promise<FollowInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<FollowInput[]> {
    const results = await this.loader.loadMany(ids)

    return results.filter(result => !(result instanceof Error)) as FollowInput[]
  }
}
