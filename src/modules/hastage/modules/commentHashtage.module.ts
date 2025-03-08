import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { UserModule } from 'src/modules/users/users.module'
import { User } from 'src/modules/users/entity/user.entity'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { Hashtag } from '../entity/hastage.entity'
import { CommnetHashtagLoader } from '../loaders/comment.loader '
import { CommnetHashtagService } from '../services/commnetHastage.service'
import { CommnetHashtagResolver } from '../resolvers/commnetHashtag.resolver'
import { CommentModule } from 'src/modules/comment/comment.module'
import { CommentService } from 'src/modules/comment/comment.service'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { Post } from 'src/modules/post/entity/post.entity '
import { Like } from 'src/modules/like/entity/like.entity '
import { Banner } from 'src/modules/banner/entity/bannner.entity'
import { NotificationModule } from 'src/common/queues/notification/notification.module'

@Module({
  imports: [
    UserModule,
    CommentModule,
    RedisModule,
    WebSocketModule,
    NotificationModule,
    SequelizeModule.forFeature([Hashtag, Like, Banner, Post, Comment, User]),
  ],
  providers: [
    CommnetHashtagLoader,
    CommnetHashtagService,
    CommentService,
    CommnetHashtagResolver,
  ],
})
export class CommentHashtagModule {}
