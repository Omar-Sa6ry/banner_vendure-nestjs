import { Module } from '@nestjs/common'
import { PostResolver } from './post.resolver'
import { PostService } from './post.service'
import { UserModule } from '../users/users.module'
import { RedisModule } from 'src/common/redis/redis.module'
import { Post } from './entity/post.entity '
import { UploadModule } from '../../common/upload/upload.module'
import { User } from '../users/entity/user.entity'
import { UploadService } from '../../common/upload/upload.service'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { SequelizeModule } from '@nestjs/sequelize'

@Module({
  imports: [
    UserModule,
    UploadModule,
    RedisModule,
    // LikeModule,
    WebSocketModule,
    SequelizeModule.forFeature([Post, User]),
  ],
  providers: [PostResolver, PostService, UploadService],
})
export class PostModule {}
