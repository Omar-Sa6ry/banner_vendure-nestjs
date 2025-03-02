import { Module } from '@nestjs/common'
import { PostResolver } from './post.resolver'
import { PostService } from './post.service'
import { UserModule } from '../users/users.module'
import { RedisModule } from 'src/common/redis/redis.module'
import { Post } from './entity/post.entity '
import { UploadModule } from '../../common/upload/upload.module'
import { User } from '../users/entity/user.entity'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { SequelizeModule } from '@nestjs/sequelize'
import { postLoader } from './loader/comment.loader'
import { Comment } from '../comment/entity/comment.entity '

@Module({
  imports: [
    UserModule,
    UploadModule,
    RedisModule,
    // LikeModule,
    WebSocketModule,
    SequelizeModule.forFeature([Post, Comment, User]),
  ],
  providers: [PostResolver, PostService, postLoader],
})
export class PostModule {}
