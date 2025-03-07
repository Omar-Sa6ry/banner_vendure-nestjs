import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { ReplyInput } from '../input/reply.input'
import { Reply } from '../entity/reply.entity'
import { Comment } from 'src/modules/comment/entity/comment.entity '

@Injectable()
export class ReplyLoader {
  private loader: DataLoader<number, ReplyInput>

  constructor (
    @InjectModel(Reply) private ReplyRepo: typeof Reply,
    @InjectModel(User) private userRepo: typeof User,
    @InjectModel(Comment) private commentRepo: typeof Comment,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, ReplyInput>(async (keys: number[]) => {
      const replys = await this.ReplyRepo.findAll({
        where: { id: { [Op.in]: keys } },
      })

      const userIds = [...new Set(replys.map(reply => reply.userId))]
      const users = await this.userRepo.findAll({
        where: { id: { [Op.in]: userIds } },
      })
      const userMap = new Map(users.map(user => [user.id, user]))

      const commentIds = [...new Set(replys.map(reply => reply.commentId))]
      const comments = await this.commentRepo.findAll({
        where: { id: { [Op.in]: commentIds } },
      })
      const commentMap = new Map(comments.map(comment => [comment.id, comment]))

      return keys.map(key => {
        const reply = replys.find(c => c.id === key)?.dataValues
        if (!reply) throw new NotFoundException(this.i18n.t('reply.NOT_FOUND'))

        const comment = commentMap.get(reply.commentId)?.dataValues
        if (!comment)
          throw new NotFoundException(this.i18n.t('comment.NOT_FOUND'))

        const user = userMap.get(reply.userId)?.dataValues
        if (!user) throw new NotFoundException(this.i18n.t('user.NOT_FOUND'))

        return { ...reply, user, comment }
      })
    })
  }

  load (id: number): Promise<ReplyInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<ReplyInput[]> {
    const results = await this.loader.loadMany(ids)

    return results.filter(result => !(result instanceof Error)) as ReplyInput[]
  }
}
