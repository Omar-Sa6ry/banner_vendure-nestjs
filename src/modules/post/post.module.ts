import { Module } from '@nestjs/common'
import { PostResolver } from './post.resolver'
import { PostService } from './post.service'
import { UserModule } from '../users/users.module'
import { RedisModule } from 'src/common/redis/redis.module'
import { Post } from './entity/post.entity '
import { User } from '../users/entity/user.entity'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { SequelizeModule } from '@nestjs/sequelize'
import { postLoader } from './loader/post.loader'
import { Comment } from '../comment/entity/comment.entity '
import { PostLikeModule } from '../like/modules/postLike.module'
import { Like } from '../like/entity/like.entity '
import { Banner } from '../banner/entity/bannner.entity'

@Module({
  imports: [
    SequelizeModule.forFeature([Post, Banner, Like, Comment, User]),
    UserModule,
    PostLikeModule,
    RedisModule,
    WebSocketModule,
  ],
  providers: [PostResolver, PostService, postLoader],
  exports: [PostService, postLoader, PostLikeModule],
})
export class PostModule {}
