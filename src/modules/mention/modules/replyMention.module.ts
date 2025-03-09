import { Module } from '@nestjs/common'
import { UserModule } from '../../users/users.module'
import { Post } from '../../post/entity/post.entity '
import { Mention } from '../entity/mention.entity '
import { Comment } from '../../comment/entity/comment.entity '
import { User } from '../../users/entity/user.entity'
import { SequelizeModule } from '@nestjs/sequelize'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { NotificationModule } from 'src/common/queues/notification/notification.module'
import { Reply } from 'src/modules/reply/entity/reply.entity'
import { ReplyMentionResolver } from '../resolvers/replyMention.resolver'
import { ReplyMentionService } from '../services/replyMention.service'
import { RelyMentionLoader } from '../loader/replyMention.loader'
import { ReplyModule } from 'src/modules/reply/reply.module'

@Module({
  imports: [
    SequelizeModule.forFeature([Post, Reply, User, Comment, Mention]),
    UserModule,
    ReplyModule,
    RedisModule,
    WebSocketModule,
    NotificationModule,
  ],
  providers: [ReplyMentionResolver, ReplyMentionService, RelyMentionLoader],
})
export class ReplyMentionModule {}
