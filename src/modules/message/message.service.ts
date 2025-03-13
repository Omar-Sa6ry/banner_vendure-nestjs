import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { UserService } from '../users/users.service'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { Message } from './entity/message.entity'
import { CreateMessageDto } from './dto/CreateMessage.dto'
import { I18nService } from 'nestjs-i18n'
import { NotificationService } from 'src/common/queues/notification/notification.service'
import { Op } from 'sequelize'
import { Limit, Page } from 'src/common/constant/messages.constant'
import { MessageLoader } from './loader/message.loader'
import {
  messageInput,
  messageInputResponse,
  messagesInputResponse,
} from './input/message.input'

@Injectable()
export class MessageService {
  constructor (
    private readonly i18n: I18nService,
    private readonly usersService: UserService,
    private readonly messageLoader: MessageLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    private readonly notificationService: NotificationService,
    @InjectModel(Message) private messageModel: typeof Message,
  ) {}

  async send (
    senderId: number,
    createMessageDto: CreateMessageDto,
  ): Promise<messageInputResponse> {
    const sender = await (await this.usersService.findById(senderId))?.data
    if (!sender)
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const receiver = await (
      await this.usersService.findById(createMessageDto.receiverId)
    )?.data
    if (!receiver)
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const message = await this.messageModel.create({
      ...createMessageDto,
      senderId,
    })

    const data: messageInput = {
      ...message.dataValues,
      sender,
      receiver,
    }

    const relationCacheKey = `message:${senderId}:${receiver.id}`
    await this.redisService.set(relationCacheKey, data)

    this.websocketGateway.sendMessageToUser(
      receiver.id.toString(),
      'newMessage',
      data,
    )

    this.notificationService.sendNotification(
      receiver.fcmToken,
      await this.i18n.t('message.CREATED'),
      `${sender.userName} send message for you`,
    )

    return {
      data,
      statusCode: 201,
      message: await this.i18n.t('message.CREATED'),
    }
  }

  async chat (
    senderId: number,
    receiverId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<messagesInputResponse> {
    const sender = await (await this.usersService.findById(senderId))?.data
    if (!sender)
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const receiver = await (await this.usersService.findById(receiverId))?.data
    if (!receiver)
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const { rows: data, count: total } =
      await this.messageModel.findAndCountAll({
        where: {
          [Op.or]: [
            { receiverId: senderId, senderId: receiverId },
            { senderId: senderId, receiverId: receiverId },
          ],
        },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      })

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('message.NOT_FOUNDS'))

    const messages = await this.messageLoader.loadMany(data.map(msg => msg.id))

    const items: messageInput[] = data.map((m, index) => {
      const message = messages[index]
      console.log(message)
      if (!message)
        throw new NotFoundException(this.i18n.t('message.NOT_FOUND'))

      return message
    })

    const result: messagesInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    const relationCacheKey = `message:${senderId}:${receiverId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async userMessages (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<messagesInputResponse> {
    const { rows: data, count: total } =
      await this.messageModel.findAndCountAll({
        where: {
          [Op.or]: [{ receiverId: userId }, { senderId: userId }],
        },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      })
    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('message.NOT_FOUNDS'))

    const messages = await this.messageLoader.loadMany(data.map(msg => msg.id))

    const items: messageInput[] = data.map((m, index) => {
      const message = messages[index]
      if (!message)
        throw new NotFoundException(this.i18n.t('message.NOT_FOUND'))

      return message
    })

    const result: messagesInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    return result
  }

  async markMessageRead (
    senderId: number,
    receiverId: number,
  ): Promise<messageInputResponse> {
    const sender = await (await this.usersService.findById(senderId))?.data
    if (!sender)
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const receiver = await (await this.usersService.findById(receiverId))?.data
    if (!receiver)
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const message = await this.messageModel.findOne({
      where: { senderId, receiverId, isRead: false },
    })

    message.isRead = true
    await message.save()

    const data: messageInput = {
      ...message.dataValues,
      sender: sender.dataValues,
      receiver: receiver.dataValues,
    }

    const relationCacheKey = `message:${senderId}:${receiver.id}`
    await this.redisService.set(relationCacheKey, data)

    return { message: await this.i18n.t('message.READED'), data }
  }

  async gotNotRead (
    senderId: number,
    receiverId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<messagesInputResponse> {
    const { rows: data, count: total } =
      await this.messageModel.findAndCountAll({
        where: { receiverId, senderId, isRead: false },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      })

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('message.NOT_FOUNDS'))

    const messages = await this.messageLoader.loadMany(data.map(msg => msg.id))
    const items: messageInput[] = data.map((m, index) => {
      const message = messages[index]
      if (!message)
        throw new NotFoundException(this.i18n.t('message.NOT_FOUND'))

      return message
    })

    const result: messagesInputResponse = {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }

    return result
  }

  async deleteMessage (
    senderId: number,
    id: number,
  ): Promise<messageInputResponse> {
    const message = await this.messageModel.findOne({
      where: { senderId, id },
    })

    if (!message) throw new NotFoundException(this.i18n.t('message.NOT_FOUND'))

    await this.messageModel.destroy({ where: { id } })

    return { data: null, message: this.i18n.t('message.DELETED') }
  }
}
