import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { UserModule } from 'src/modules/users/users.module'
import { User } from 'src/modules/users/entity/user.entity'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { Hashtag } from '../entity/hastage.entity'
import { ReplyModule } from 'src/modules/reply/reply.module'
import { ReplyHashtagService } from '../services/replyHashtage.service'
import { ReplyHashtagLoader } from '../loaders/replyHashtag.loader '
import { ReplyHashtagResolver } from '../resolvers/replyHashtag.resolver'
import { ReplyService } from 'src/modules/reply/reply.service'
import { Reply } from 'src/modules/reply/entity/reply.entity'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { Post } from 'src/modules/post/entity/post.entity '
import { ReplyLoader } from 'src/modules/reply/loader/reply.loader'

@Module({
  imports: [
    UserModule,
    ReplyModule,
    RedisModule,
    WebSocketModule,
    SequelizeModule.forFeature([Hashtag, Post, Reply, Comment, User]),
  ],
  providers: [
    ReplyHashtagService,
    ReplyHashtagLoader,
    ReplyService,
    ReplyHashtagResolver,
  ],
})
export class ReplyHashtagModule {}
