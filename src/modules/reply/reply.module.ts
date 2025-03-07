import { Module } from '@nestjs/common'
import { Reply } from './entity/reply.entity'
import { Post } from '../post/entity/post.entity '
import { User } from '../users/entity/user.entity'
import { UserModule } from '../users/users.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { ReplyService } from './reply.service'
import { ReplyResolver } from './reply.resolver'
import { Comment } from '../comment/entity/comment.entity '
import { RedisModule } from 'src/common/redis/redis.module'
import { NotificationModule } from 'src/common/queues/notification/notification.module'
import { SequelizeModule } from '@nestjs/sequelize'
import { ReplyLoader } from './loader/reply.loader'

@Module({
  imports: [
    SequelizeModule.forFeature([Post, User, Comment, Reply]),
    UserModule,
    RedisModule,
    NotificationModule,
    WebSocketModule,
  ],
  providers: [ReplyResolver, ReplyService, ReplyLoader],
})
export class ReplyModule {}
