import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { SequelizeModule, SequelizeModuleOptions } from '@nestjs/sequelize'
import { Banner } from 'src/modules/banner/entity/bannner.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { Follow } from 'src/modules/follow/entity/follow.entity'
import { Interaction } from 'src/modules/interaction/entity/interaction.entity'
import { Like } from 'src/modules/like/entity/like.entity '
import { Partner } from 'src/modules/partner/entity/partner.entity'
import { Post } from 'src/modules/post/entity/post.entity '
import { User } from 'src/modules/users/entity/user.entity'

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
          Follow,
          Campaign,
          Partner,
          Banner,
          Interaction,
          Post,
          Like,
          Comment,
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
