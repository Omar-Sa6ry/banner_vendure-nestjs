import { Module } from '@nestjs/common'
import { MessageResolver } from './message.resolver'
import { MessageService } from './message.service'
import { Message } from './entity/message.entity'
import { RedisModule } from 'src/common/redis/redis.module'
import { UserModule } from '../users/users.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { SequelizeModule } from '@nestjs/sequelize'
import { MessageLoader } from './loader/message.loader'
import { NotificationModule } from 'src/common/queues/notification/notification.module'
import { User } from '../users/entity/user.entity'

@Module({
  imports: [
    SequelizeModule.forFeature([Message, User]),
    RedisModule,
    UserModule,
    RedisModule,
    WebSocketModule,
    NotificationModule,
  ],
  providers: [MessageResolver, MessageService, MessageLoader],
})
export class MessageModule {}
