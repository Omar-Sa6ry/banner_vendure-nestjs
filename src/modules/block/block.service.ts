import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { UserService } from '../users/users.service'
import { Limit, Page } from 'src/common/constant/messages.constant'
import { BlockLoader } from './loader/block.loader'
import { Block } from './entity/block.entity'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { RedisService } from 'src/common/redis/redis.service'
import { I18nService } from 'nestjs-i18n'
import {
  BlockInput,
  BlockInputResponse,
  BlocksResponseInput,
} from './input/Block.input.dto'

@Injectable()
export class BlockService {
  constructor (
    private readonly blockLoader: BlockLoader,
    private readonly usersService: UserService,
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    @InjectModel(Block) private blockRepo: typeof Block,
  ) {}

  async block (
    blockerId: number,
    blockingId: number,
  ): Promise<BlockInputResponse> {
    const blocker = await (await this.usersService.findById(blockerId))?.data
    if (!blocker)
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const blocking = await (await this.usersService.findById(blockingId))?.data
    if (!blocking)
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const relation = await this.blockRepo.findOne({
      where: { blockerId, blockingId },
    })

    if (!relation) {
      const block = await this.blockRepo.create({
        blockerId,
        blockingId: blocking.id,
      })

      const data: BlockInput = {
        id: block.id,
        blocker,
        blocking,
      }
      const relationCacheKey = `block:${blocker}:${blocking}`
      await this.redisService.set(relationCacheKey, data)

      this.websocketGateway.broadcast('blockCreated', {
        blockId: relation.id,
      })

      return {
        message: await this.i18n.t('block.CREATED'),
        data,
        statusCode: 201,
      }
    }

    throw new BadRequestException(await this.i18n.t('block.ALREADY_BLOCK'))
  }

  async unblock (
    blockerId: number,
    blockingId: number,
  ): Promise<BlockInputResponse> {
    const blocker = await (await this.usersService.findById(blockerId))?.data
    if (!blocker)
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const blocking = await (await this.usersService.findById(blockingId))?.data
    if (!blocking)
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'))

    const relation = await this.blockRepo.findOne({
      where: { blockerId, blockingId: blocking.id },
    })

    const data: BlockInput = { ...relation.dataValues, blocker, blocking }

    const relationCacheKey = `block:${blocker}:${blocking}`
    await this.redisService.set(relationCacheKey, data)

    if (!relation)
      throw new BadRequestException(
        await this.i18n.t('block.ALREADY_NOT_BLOCK'),
      )

    await relation.destroy()
    return { message: await this.i18n.t('block.DELETED'), data }
  }

  async getBlock (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<BlocksResponseInput> {
    const { rows: data, count: total } = await this.blockRepo.findAndCountAll({
      where: { blockerId: userId },
      offset: (page - 1) * limit,
      limit,
    })

    if (data.length === 0)
      throw new NotFoundException(await this.i18n.t('block.NOT_FOUNDS'))

    const blocksIds = data.map(block => block.id)
    const blocks = await this.blockLoader.loadMany(blocksIds)

    const items: BlockInput[] = data.map((p, index) => {
      const block = blocks[index]
      if (!block) throw new NotFoundException(this.i18n.t('block.NOT_FOUND'))

      return block
    })

    return {
      items,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
}
