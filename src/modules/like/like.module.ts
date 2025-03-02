import { Module } from '@nestjs/common'
import { Post } from '../post/entity/post.entity '
import { UserModule } from '../users/users.module'
import { Comment } from '../comment/entity/comment.entity '
import { User } from '../users/entity/user.entity'
import { Like } from './entity/like.entity '
import { LikeService } from './like.service'
import { LikeResolver } from './like.resolver'
import { SequelizeModule } from '@nestjs/sequelize'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { LikeLoader } from './loader/like.loader'

@Module({
  imports: [
    SequelizeModule.forFeature([Post, Comment, User, Like]),
    UserModule,
    RedisModule,
    WebSocketModule,
  ],
  providers: [LikeResolver, LikeService, LikeLoader],
  exports: [LikeService],
})
export class LikeModule {}
