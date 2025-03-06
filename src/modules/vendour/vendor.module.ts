import { Module } from '@nestjs/common'
import { VendorResolver } from './Vendor.resolver'
import { UserModule } from '../users/users.module'
import { RedisModule } from 'src/common/redis/redis.module'
import { User } from '../users/entity/user.entity'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { SequelizeModule } from '@nestjs/sequelize'
import { Vendor } from './entity/vendour.entity'
import { Campaign } from '../campaign/entity/campaign.entity'
import { VendorService } from './vendour.service'
import { Banner } from '../banner/entity/bannner.entity'
import { VendorLoader } from './loader/vendor.loader'

@Module({
  imports: [
    SequelizeModule.forFeature([Campaign, User, Vendor, Banner]),
    UserModule,
    RedisModule,
    WebSocketModule,
  ],
  providers: [VendorResolver, VendorService, VendorLoader],
})
export class VendorModule {}
