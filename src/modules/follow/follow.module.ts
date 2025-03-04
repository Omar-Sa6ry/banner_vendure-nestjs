import { Module } from '@nestjs/common'
import { UserModule } from '../users/users.module'
import { RedisModule } from 'src/common/redis/redis.module'
import { FollowService } from './follow.service'
import { FollowResolver } from './follow.resolver'
import { User } from '../users/entity/user.entity'
import { Follow } from './entity/follow.entity'
import { SequelizeModule } from '@nestjs/sequelize'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { FollowLoader } from './loader/follow.loader'
import { NotificationModule } from 'src/common/queues/notification/notification.module'

@Module({
  imports: [
    SequelizeModule.forFeature([Follow, User]),
    RedisModule,
    UserModule,
    WebSocketModule,
    NotificationModule,
  ],
  providers: [FollowResolver, FollowService, FollowLoader],
})
export class FollowModule {}
