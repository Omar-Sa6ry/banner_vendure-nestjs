import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { Comment } from '../../comment/entity/comment.entity '
import { User } from '../../users/entity/user.entity'
import { Like } from '../entity/like.entity '
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { NotificationModule } from 'src/common/queues/notification/notification.module'
import { RedisModule } from 'src/common/redis/redis.module'
import { UserModule } from '../../users/users.module'
import { Reply } from 'src/modules/reply/entity/reply.entity'
import { ReplyLikeResolver } from '../resolvers/replyLike.resolver'
import { ReplyLikeService } from '../services/replyLike.service'
import { ReplyLikeLoader } from '../loaders/replyLike.loader'
import { ReplyModule } from 'src/modules/reply/reply.module'
import { ReplyService } from 'src/modules/reply/reply.service'
import { Post } from 'src/modules/post/entity/post.entity '
import { ReplyLoader } from 'src/modules/reply/loader/reply.loader'

@Module({
  imports: [
    SequelizeModule.forFeature([Reply, Post, Comment, User, Like]),
    UserModule,
    ReplyModule,
    RedisModule,
    NotificationModule,
    WebSocketModule,
  ],
  providers: [
    ReplyLikeResolver,
    ReplyLikeService,
    ReplyService,
    ReplyLoader,
    ReplyLikeLoader,
  ],
  exports: [ReplyLikeService],
})
export class ReplyLikeModule {}
