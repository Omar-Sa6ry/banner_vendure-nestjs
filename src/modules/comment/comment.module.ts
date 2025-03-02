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

@Module({
  imports: [
    UserModule,
    WebSocketModule,
    RedisModule,
    SequelizeModule.forFeature([Post, User, Comment]),
  ],
  providers: [CommentResolver, CommentService, CommentLoader],
})
export class CommentModule {}
