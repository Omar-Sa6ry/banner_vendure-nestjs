import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { SequelizeModule, SequelizeModuleOptions } from '@nestjs/sequelize'
import { Banner } from 'src/modules/banner/entity/bannner.entity'
import { Buyer } from 'src/modules/buyer/entity/buyer.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { Follow } from 'src/modules/follow/entity/follow.entity'
import { Hashtag } from 'src/modules/hastage/entity/hastage.entity'
import { Interaction } from 'src/modules/interaction/entity/interaction.entity'
import { Like } from 'src/modules/like/entity/like.entity '
import { Message } from 'src/modules/message/entity/message.entity'
import { Partner } from 'src/modules/partner/entity/partner.entity'
import { Post } from 'src/modules/post/entity/post.entity '
import { Reply } from 'src/modules/reply/entity/reply.entity'
import { User } from 'src/modules/users/entity/user.entity'
import { Vendor } from 'src/modules/vendour/entity/vendour.entity'

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): SequelizeModuleOptions => ({
        dialect: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        models: [
          User,
          Vendor,
          Buyer,
          Follow,
          Message,
          Campaign,
          Partner,
          Banner,
          Interaction,
          Post,
          Comment,
          Reply,
          Like,
          Hashtag,
        ],
        autoLoadModels: true,
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DataBaseModule {}
