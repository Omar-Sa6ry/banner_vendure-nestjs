import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { ReplyHastageInput } from '../inputs/HashtagReply.input.dto'
import { Reply } from 'src/modules/reply/entity/reply.entity'
import { Hashtag } from '../entity/hastage.entity'

@Injectable()
export class ReplyHashtagLoader {
  private loader: DataLoader<number, ReplyHastageInput>

  constructor (
    @InjectModel(Reply) private replyRepo: typeof Reply,
    @InjectModel(Hashtag) private hashtagRepo: typeof Hashtag,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, ReplyHastageInput>(
      async (keys: number[]) => {
        const hashtages = await this.hashtagRepo.findAll({
          where: { id: { [Op.in]: keys } },
        })

        const userIds = [...new Set(hashtages.map(reply => reply.userId))]
        const users = await this.userRepo.findAll({
          where: { id: { [Op.in]: userIds } },
        })
        const userMap = new Map(users.map(user => [user.id, user]))

        const replyIds = [...new Set(hashtages.map(reply => reply.replyId))]
        const replys = await this.replyRepo.findAll({
          where: { id: { [Op.in]: replyIds } },
        })
        const replyMap = new Map(replys.map(reply => [reply.id, reply]))

        return keys.map(key => {
          const hashtage = hashtages.find(c => c.id === key)?.dataValues
          if (!hashtage)
            throw new NotFoundException(this.i18n.t('reply.NOT_FOUND'))

          const reply = replyMap.get(hashtage.replyId)?.dataValues
          if (!reply)
            throw new NotFoundException(this.i18n.t('reply.NOT_FOUND'))

          const user = userMap.get(hashtage.userId)?.dataValues
          if (!user) throw new NotFoundException(this.i18n.t('user.NOT_FOUND'))

          return { ...hashtage, user, reply }
        })
      },
    )
  }

  load (id: number): Promise<ReplyHastageInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<ReplyHastageInput[]> {
    const results = await this.loader.loadMany(ids)

    return results.filter(
      result => !(result instanceof Error),
    ) as ReplyHastageInput[]
  }
}
