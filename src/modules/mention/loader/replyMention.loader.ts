import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { Mention } from '../entity/mention.entity '
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { ReplyInput } from 'src/modules/reply/input/reply.input'
import { Reply } from 'src/modules/reply/entity/reply.entity'
import { ReplyMentionInput } from '../inputs/replyMention.input'

@Injectable()
export class RelyMentionLoader {
  private loader: DataLoader<number, ReplyMentionInput>

  constructor (
    @InjectModel(Mention) private mentionRepo: typeof Mention,
    @InjectModel(Reply) private replyRepo: typeof Reply,
    @InjectModel(Comment) private commentRepo: typeof Comment,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, ReplyMentionInput>(
      async (keys: number[]) => {
        const mentions = await this.mentionRepo.findAll({
          where: { id: { [Op.in]: keys } },
        })

        const replyIds = [...new Set(mentions.map(mention => mention.replyId))]
        const replys = await this.replyRepo.findAll({
          where: { id: { [Op.in]: replyIds } },
        })
        const replyMap = new Map(replys.map(reply => [reply.id, reply]))

        const mentionUserIds = [
          ...new Set(mentions.map(mention => mention.mentionFromId)),
          ...new Set(mentions.map(mention => mention.mentionToId)),
        ]
        const mentionUsers = await this.userRepo.findAll({
          where: { id: { [Op.in]: mentionUserIds } },
        })
        const mentionUserMap = new Map(
          mentionUsers.map(user => [user.id, user]),
        )

        const userIds = [...new Set(replys.map(reply => reply.userId))]
        const users = await this.userRepo.findAll({
          where: { id: { [Op.in]: userIds } },
        })
        const userMap = new Map(users.map(user => [user.id, user]))

        const commentIds = [...new Set(replys.map(reply => reply.commentId))]
        const comments = await this.commentRepo.findAll({
          where: { id: { [Op.in]: commentIds } },
        })
        const commentMap = new Map(
          comments.map(comment => [comment.id, comment]),
        )

        return keys.map(id => {
          const mention = mentions.find(c => c.id === id)
          if (!mention)
            throw new NotFoundException(this.i18n.t('replyMention.NOT_FOUND'))

          const reply = replyMap.get(mention.replyId).dataValues
          if (!reply)
            throw new NotFoundException(this.i18n.t('reply.NOT_FOUND'))

          const mentionTo = mentionUserMap.get(mention.mentionToId).dataValues
          if (!mentionTo)
            throw new NotFoundException(
              this.i18n.t('replyMention.NOT_FOUND_TO'),
            )

          const mentionFrom = mentionUserMap.get(
            mention.mentionFromId,
          ).dataValues
          if (!mentionFrom)
            throw new NotFoundException(
              this.i18n.t('replyMention.NOT_FOUND_FROM'),
            )

          const comment = commentMap.get(reply.commentId)?.dataValues
          if (!comment)
            throw new NotFoundException(this.i18n.t('comment.NOT_FOUND'))

          const user = userMap.get(reply.userId)?.dataValues
          if (!user) throw new NotFoundException(this.i18n.t('user.NOT_FOUND'))

          const replyDetails: ReplyInput = { ...reply, user, comment }

          return {
            ...mention.dataValues,
            reply: replyDetails,
            mentionTo,
            mentionFrom,
          }
        })
      },
    )
  }

  load (id: number): Promise<ReplyMentionInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<ReplyMentionInput[]> {
    const results = await this.loader.loadMany(ids)

    return results.filter(
      result => !(result instanceof Error),
    ) as ReplyMentionInput[]
  }
}
