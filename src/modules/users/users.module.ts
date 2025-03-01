import { Module } from '@nestjs/common'
import { User } from './entity/user.entity'
import { UserService } from './users.service'
import { UserResolver } from './users.resolver'
import { RedisModule } from 'src/common/redis/redis.module'
import { UploadService } from '../../common/upload/upload.service'
import { EmailModule } from 'src/common/queues/email/email.module'
import { SequelizeModule } from '@nestjs/sequelize'

@Module({
  imports: [SequelizeModule.forFeature([User]), EmailModule, RedisModule],
  providers: [UserService, UserResolver, UploadService],
  exports: [UserService],
})
export class UserModule {}
