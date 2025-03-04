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
import { NotificationLoader } from 'src/common/queues/notification/loader/notification.loader'
import { Partner } from '../partner/entity/partner.entity'
import { NotificationModule } from 'src/common/queues/notification/notification.module'

@Module({
  imports: [
    SequelizeModule.forFeature([Campaign, Partner, User]),
    UserModule,
    RedisModule,
    WebSocketModule,
    NotificationModule,
  ],
  providers: [
    CampaignResolver,
    CampaignService,
    NotificationLoader,
    CampaignLoader,
  ],
  exports: [CampaignService],
})
export class CampaignModule {}
