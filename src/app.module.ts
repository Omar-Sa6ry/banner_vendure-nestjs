import { Module } from '@nestjs/common'
import { AppService } from './app.service'
import { AppResolver } from './app.resolver'
import { ConfigModule } from './common/config/config.module'
import { GraphqlModule } from './common/graphql/graphql.module'
import { DataBaseModule } from './common/database/database'
import { ThrottlerModule } from './common/throttler/throttling.module'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/users/users.module'
import { PostModule } from './modules/post/post.module'
import { TranslationModule } from './common/translation/translation.module'
import { CommentModule } from './modules/comment/comment.module'
import { LikeModule } from './modules/like/like.module'

@Module({
  imports: [
    ConfigModule,
    GraphqlModule,
    DataBaseModule,
    ThrottlerModule,
    TranslationModule,

    AuthModule,
    UserModule,
    PostModule,
    CommentModule,
    LikeModule,
  ],

  providers: [AppService, AppResolver],
})
export class AppModule {}
