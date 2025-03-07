import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { Post } from '../../post/entity/post.entity '
import { Comment } from '../../comment/entity/comment.entity '
import { User } from '../../users/entity/user.entity'
import { Like } from '../entity/like.entity '
import { PostLikeLoader } from '../loaders/postLike.loader'
import { PostLikeService } from '../services/postLike.service'
import { PostLikeResolver } from '../resolvers/postLike.resolver'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { NotificationModule } from 'src/common/queues/notification/notification.module'
import { RedisModule } from 'src/common/redis/redis.module'
import { UserModule } from '../../users/users.module'
import { Banner } from '../../banner/entity/bannner.entity'

@Module({
  imports: [
    SequelizeModule.forFeature([Post, Banner, Comment, User, Like]),
    UserModule,
    RedisModule,
    NotificationModule,
    WebSocketModule,
  ],
  providers: [PostLikeResolver, PostLikeService, PostLikeLoader],
  exports: [PostLikeService],
})
export class PostLikeModule {}
