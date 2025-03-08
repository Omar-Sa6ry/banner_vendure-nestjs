import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { UserModule } from 'src/modules/users/users.module'
import { User } from 'src/modules/users/entity/user.entity'
import { PostModule } from 'src/modules/post/post.module'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { PostService } from 'src/modules/post/post.service'
import { Hashtag } from '../entity/hastage.entity'
import { PostHashtagResolver } from '../resolvers/postHashtage.resolver'
import { PostHashtagService } from '../services/postHashtage.service'
import { PostHashtagLoader } from '../loaders/postHashtage.loader'
import { PostLikeService } from 'src/modules/like/services/postLike.service'
import { Post } from 'src/modules/post/entity/post.entity '
import { Banner } from 'src/modules/banner/entity/bannner.entity'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { Like } from 'src/modules/like/entity/like.entity '
import { NotificationModule } from 'src/common/queues/notification/notification.module'

@Module({
  imports: [
    UserModule,
    PostModule,
    RedisModule,
    WebSocketModule,
    NotificationModule,
    SequelizeModule.forFeature([Hashtag, Banner, Comment, Post, Like, User]),
  ],
  providers: [
    PostHashtagResolver,
    PostHashtagService,
    PostService,
    PostLikeService,
    PostHashtagLoader,
  ],
})
export class PostHashtagModule {}
