import { Module } from '@nestjs/common'
import { InteractionService } from './interaction.service'
import { InteractionResolver } from './interaction.resolver'
import { Interaction } from './entity/interaction.entity'
import { User } from '../users/entity/user.entity'
import { RedisModule } from 'src/common/redis/redis.module'
import { UserModule } from '../users/users.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { InteractionLoader } from './loader/interaction.loader'
import { SequelizeModule } from '@nestjs/sequelize'
import { Banner } from '../banner/entity/bannner.entity'
import { CampaignModule } from '../campaign/campaign.module'
import { Partner } from '../partner/entity/partner.entity'
import { Campaign } from '../campaign/entity/campaign.entity'

@Module({
  imports: [
    SequelizeModule.forFeature([Interaction, Banner, Partner, Campaign, User]),
    RedisModule,
    UserModule,
    CampaignModule,
    WebSocketModule,
  ],
  providers: [InteractionService, InteractionResolver, InteractionLoader],
  exports: [InteractionService],
})
export class InteractionModule {}
