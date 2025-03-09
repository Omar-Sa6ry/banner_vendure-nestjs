import { Module } from '@nestjs/common'
import { UserModule } from '../../users/users.module'
import { Post } from '../../post/entity/post.entity '
import { Mention } from '../entity/mention.entity '
import { Comment } from '../../comment/entity/comment.entity '
import { User } from '../../users/entity/user.entity'
import { SequelizeModule } from '@nestjs/sequelize'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { Banner } from 'src/modules/banner/entity/bannner.entity'
import { CommentMentionResolver } from '../resolvers/commnetMention.resolver'
import { CommentMentionLoader } from '../loader/commentMention.loader'
import { CommentMentionService } from '../services/commentMention.service'
import { NotificationModule } from 'src/common/queues/notification/notification.module'
import { CommentModule } from 'src/modules/comment/comment.module'
import { Like } from 'src/modules/like/entity/like.entity '

@Module({
  imports: [
    SequelizeModule.forFeature([Post, Like, Banner, User, Comment, Mention]),
    UserModule,
    CommentModule,
    RedisModule,
    WebSocketModule,
    NotificationModule,
  ],
  providers: [
    CommentMentionResolver,
    CommentMentionLoader,
    CommentMentionService,
  ],
})
export class CommentMentionModule {}
