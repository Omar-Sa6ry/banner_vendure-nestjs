import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { messageInput } from '../input/message.input'
import { Message } from '../entity/message.entity'

@Injectable()
export class MessageLoader {
  private loader: DataLoader<number, messageInput>

  constructor (
    @InjectModel(User) private userRepo: typeof User,
    @InjectModel(Message) private messageRepo: typeof Message,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, messageInput>(
      async (keys: number[]) => {
        const messages = await this.messageRepo.findAll({
          where: { id: { [Op.in]: keys } },
        })

        const senderIds = [
          ...new Set(messages.map(message => message.senderId)),
        ]
        const senders = await this.userRepo.findAll({
          where: { id: { [Op.in]: senderIds } },
        })
        const senderMap = new Map(senders.map(sender => [sender.id, sender]))

        const receiverIds = [...new Set(messages.map(message => message.id))]
        const receivers = await this.userRepo.findAll({
          where: { id: { [Op.in]: receiverIds } },
        })
        const receiverMap = new Map(
          receivers.map(receiver => [receiver.id, receiver]),
        )

        return keys.map(key => {
          const message = messages.find(c => c.id === key)
          if (!message)
            throw new NotFoundException(this.i18n.t('message.NOT_FOUND'))

          const sender = senderMap.get(message.senderId)?.dataValues
          if (!sender)
            throw new NotFoundException(this.i18n.t('user.NOT_FOUND'))

          const receiver = receiverMap.get(message.receiverId)?.dataValues
          if (!receiver)
            throw new NotFoundException(this.i18n.t('user.NOT_FOUND'))

          return { ...message.dataValues, sender, receiver }
        })
      },
    )
  }

  load (id: number): Promise<messageInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<messageInput[]> {
    const results = await this.loader.loadMany(ids)

    return results.filter(
      result => !(result instanceof Error),
    ) as messageInput[]
  }
}
