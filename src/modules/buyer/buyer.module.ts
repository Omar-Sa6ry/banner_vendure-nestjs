import { Module } from '@nestjs/common'
import { Buyer } from './entity/Buyer.entity'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { UserModule } from '../users/users.module'
import { User } from '../users/entity/user.entity'
import { SequelizeModule } from '@nestjs/sequelize'
import { NotificationModule } from 'src/common/queues/notification/notification.module'
import { Banner } from '../banner/entity/bannner.entity'
import { BuyerResolver } from './buyer.resolver'
import { BuyerService } from './buyer.service'
import { BuyerLoader } from './loader/buyer.loader'

@Module({
  imports: [
    SequelizeModule.forFeature([Buyer, Banner, User]),
    UserModule,
    RedisModule,
    WebSocketModule,
    NotificationModule,
  ],
  providers: [BuyerResolver, BuyerService, BuyerLoader],
})
export class BuyerModule {}
