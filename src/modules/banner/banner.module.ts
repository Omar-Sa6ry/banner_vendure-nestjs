import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { Banner } from './entity/bannner.entity'
import { Partner } from '../partner/entity/partner.entity'
import { User } from '../users/entity/user.entity'
import { Campaign } from '../campaign/entity/campaign.entity'
import { BannerService } from './banner.service'
import { BannerResolver } from './banner.resolver'
import { UserModule } from '../users/users.module'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { BannerLoader } from './loader/banner.loader'
import { UploadModule } from 'src/common/upload/upload.module'
import { CampaignModule } from '../campaign/campaign.module'
import { InteractionModule } from '../interaction/interaction.module'
import { Interaction } from '../interaction/entity/interaction.entity'

@Module({
  imports: [
    SequelizeModule.forFeature([Banner, Interaction, Partner, User, Campaign]),
    UserModule,
    InteractionModule,
    UploadModule,
    CampaignModule,
    RedisModule,
    WebSocketModule,
  ],
  providers: [BannerService, BannerResolver, BannerLoader],
})
export class BannerModule {}
