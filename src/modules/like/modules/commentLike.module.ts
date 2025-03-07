import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { Post } from '../../post/entity/post.entity '
import { Comment } from '../../comment/entity/comment.entity '
import { User } from '../../users/entity/user.entity'
import { Like } from '../entity/like.entity '
import { CommentLikeLoader } from '../loaders/commentLike.loader'
import { CommentLikeService } from '../services/commentLike.service'
import { CommentLikeResolver } from '../resolvers/commentReply.resolver'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { NotificationModule } from 'src/common/queues/notification/notification.module'
import { RedisModule } from 'src/common/redis/redis.module'
import { UserModule } from '../../users/users.module'
import { PostService } from '../../post/post.service'
import { PostLikeService } from '../services/postLike.service'
import { PostModule } from '../../post/post.module'
import { PostLikeModule } from './postLike.module'
import { PostLikeLoader } from '../loaders/postLike.loader'
import { postLoader } from '../../post/loader/post.loader'
import { Banner } from '../../banner/entity/bannner.entity'

@Module({
  imports: [
    SequelizeModule.forFeature([Post, Banner, Comment, User, Like]),
    PostModule,
    PostLikeModule,
    UserModule,
    RedisModule,
    NotificationModule,
    WebSocketModule,
  ],
  providers: [
    CommentLikeResolver,
    CommentLikeService,
    PostLikeService,
    PostLikeLoader,
    postLoader,
    PostService,
    CommentLikeLoader,
  ],
  exports: [CommentLikeService],
})
export class CommentLikeModule {}
