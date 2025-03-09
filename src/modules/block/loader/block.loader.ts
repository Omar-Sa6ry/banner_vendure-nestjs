import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { BlockInput } from '../input/Block.input.dto'
import { Block } from '../entity/block.entity'

@Injectable()
export class BlockLoader {
  private loader: DataLoader<number, BlockInput>

  constructor (
    @InjectModel(User) private userRepo: typeof User,
    @InjectModel(Block) private blockRepo: typeof Block,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, BlockInput>(async (keys: number[]) => {
      const blocks = await this.blockRepo.findAll({
        where: { id: { [Op.in]: keys } },
      })

      const blockerIds = [...new Set(blocks.map(block => block.blockerId))]
      const blockers = await this.userRepo.findAll({
        where: { id: { [Op.in]: blockerIds } },
      })
      const blockerMap = new Map(blockers.map(blocker => [blocker.id, blocker]))

      const blockingIds = [...new Set(blocks.map(block => block.id))]
      const blockings = await this.userRepo.findAll({
        where: { id: { [Op.in]: blockingIds } },
      })
      const blockingMap = new Map(
        blockings.map(blocking => [blocking.id, blocking]),
      )

      return keys.map(key => {
        const block = blocks.find(c => c.id === key)
        if (!block) throw new NotFoundException(this.i18n.t('block.NOT_FOUND'))

        const blocker = blockerMap.get(block.blockerId)?.dataValues
        if (!blocker) throw new NotFoundException(this.i18n.t('user.NOT_FOUND'))

        const blocking = blockingMap.get(block.blockingId)?.dataValues
        if (!blocking)
          throw new NotFoundException(this.i18n.t('user.NOT_FOUND'))

        return { ...block.dataValues, blocker, blocking }
      })
    })
  }

  load (id: number): Promise<BlockInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<BlockInput[]> {
    const results = await this.loader.loadMany(ids)

    return results.filter(result => !(result instanceof Error)) as BlockInput[]
  }
}
