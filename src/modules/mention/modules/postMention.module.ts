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
import { Banner } from 'src/modules/banner/entity/bannner.entity'
import { PostMentionService } from '../services/postMention.service'
import { PostMentionLoader } from '../loader/postMention.loader'
import { PostMentionResolver } from '../resolvers/postMention.resolver'
import { PostModule } from 'src/modules/post/post.module'
import { Like } from 'src/modules/like/entity/like.entity '

@Module({
  imports: [
    SequelizeModule.forFeature([Post, Banner, Like, User, Comment, Mention]),
    UserModule,
    PostModule,
    RedisModule,
    WebSocketModule,
    NotificationModule,
  ],
  providers: [PostMentionResolver, PostMentionService, PostMentionLoader],
})
export class PostMentionModule {}
