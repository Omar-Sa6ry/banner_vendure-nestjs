import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { Like } from '../entity/like.entity '
import { ReplyLikeInput } from '../inputs/replyLike.input'
import { ReplyService } from 'src/modules/reply/reply.service'

@Injectable()
export class ReplyLikeLoader {
  private loader: DataLoader<number, ReplyLikeInput>

  constructor (
    @InjectModel(Like) private likeRepo: typeof Like,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
    private readonly replyService: ReplyService,
  ) {
    this.loader = new DataLoader<number, ReplyLikeInput>(
      async (keys: number[]) => {
        const likes = await this.likeRepo.findAll({
          where: { id: { [Op.in]: keys } },
        })
        const likeMap = new Map(likes.map(like => [like.id, like]))

        const userIds = [...new Set(likes.map(like => like.userId))]
        const users = await this.userRepo.findAll({
          where: { id: { [Op.in]: userIds } },
        })
        const userMap = new Map(users.map(user => [user.id, user]))

        const replyIds = [...new Set(likes.map(like => like.replyId))]
        const replys = (await this.replyService.getAllByIds(replyIds))?.items
        const replyMap = new Map(replys.map(reply => [reply.id, reply]))

        return keys.map(id => {
          const like = likeMap.get(id).dataValues
          if (!like)
            throw new NotFoundException(this.i18n.t('likeReply.NOT_FOUND'))

          const user = userMap.get(like.userId).dataValues
          const reply = replyMap.get(like.replyId)

          return {
            ...like,
            user,
            reply,
          }
        })
      },
    )
  }

  load (id: number): Promise<ReplyLikeInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<ReplyLikeInput[]> {
    const results = await this.loader.loadMany(ids)
    return results.filter(
      (result): result is ReplyLikeInput => !(result instanceof Error),
    )
  }
}
