import { Module } from '@nestjs/common'
import { CampaignResolver } from './campaign.resolver'
import { CampaignService } from './campaign.service'
import { Campaign } from './entity/campaign.entity'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { UserModule } from '../users/users.module'
import { CampaignLoader } from './loader/campaign.loader'
import { User } from '../users/entity/user.entity'
import { SequelizeModule } from '@nestjs/sequelize'

@Module({
  imports: [
    SequelizeModule.forFeature([Campaign, User]),
    UserModule,
    RedisModule,
    WebSocketModule,
  ],
  providers: [CampaignResolver, CampaignService, CampaignLoader],
  exports: [CampaignService],
})
export class CampaignModule {}
