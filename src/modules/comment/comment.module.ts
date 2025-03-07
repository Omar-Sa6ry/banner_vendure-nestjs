import { Module } from '@nestjs/common'
import { CommentResolver } from './comment.resolver'
import { CommentService } from './comment.service'
import { Comment } from './entity/comment.entity '
import { Post } from '../post/entity/post.entity '
import { User } from '../users/entity/user.entity'
import { UserModule } from '../users/users.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { SequelizeModule } from '@nestjs/sequelize'
import { CommentLoader } from './loader/comment.loader'
import { RedisModule } from 'src/common/redis/redis.module'
import { Like } from '../like/entity/like.entity '
import { NotificationModule } from 'src/common/queues/notification/notification.module'
import { Banner } from '../banner/entity/bannner.entity'
import { PostLikeModule } from '../like/modules/postLike.module'

@Module({
  imports: [
    UserModule,
    WebSocketModule,
    RedisModule,
    PostLikeModule,
    NotificationModule,
    SequelizeModule.forFeature([Post, Banner, User, Like, Comment]),
  ],
  providers: [CommentResolver, CommentService, CommentLoader],
})
export class CommentModule {}
