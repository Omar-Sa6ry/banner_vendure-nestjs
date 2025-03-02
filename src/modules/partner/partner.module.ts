import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { Partner } from './entity/partner.entity'
import { Campaign } from '../campaign/entity/campaign.entity'
import { User } from '../users/entity/user.entity'
import { PartnerResolver } from './partner.resolver'
import { PartnerService } from './partner.service'
import { PartnerLoader } from './loader/partner.loader'
import { RedisModule } from 'src/common/redis/redis.module'
import { UserModule } from '../users/users.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'

@Module({
  imports: [
    SequelizeModule.forFeature([Partner, Campaign, User]),
    RedisModule,
    UserModule,
    WebSocketModule,
  ],
  providers: [PartnerService, PartnerResolver, PartnerLoader],
})
export class PartnerModule {}
