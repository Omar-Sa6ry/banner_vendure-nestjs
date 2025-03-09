import { Module } from '@nestjs/common'
import { UserModule } from '../users/users.module'
import { User } from '../users/entity/user.entity'
import { BlockService } from './block.service'
import { Block } from './entity/block.entity'
import { SequelizeModule } from '@nestjs/sequelize'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { BlockLoader } from './loader/block.loader'
import { BlockResolver } from './block.resolver'

@Module({
  imports: [
    SequelizeModule.forFeature([Block, User]),
    RedisModule,
    WebSocketModule,
    UserModule,
  ],
  providers: [BlockService, BlockResolver, BlockLoader],
})
export class BlockModule {}
