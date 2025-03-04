import { Field, InputType, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { User } from 'src/modules/users/entity/user.entity'
import { CampaignInput } from 'src/modules/campaign/input/campain.input'

@InputType()
export class BannerInput {
  @Field(() => Int)
  position: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  clicks: number

  @Field(() => Int)
  views: number

  @Field(() => String)
  url_ar: string

  @Field(() => String)
  url_en: string

  @Field(() => String)
  image_ar: string

  @Field(() => String)
  image_en: string

  @IsOptional()
  @Field(() => String)
  redirect?: string

  @Field(() => Boolean)
  isActive: boolean

  @Field(() => Date)
  createdAt: Date

  @Field(() => User)
  createdBy: User

  @Field(() => CampaignInput)
  campaign: CampaignInput
}

@InputType()
export class BannersInputResponse extends BaseResponse {
  @Field(() => [BannerInput], { nullable: true })
  @Expose()
  items: BannerInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@InputType()
export class BannerInputResponse extends BaseResponse {
  @Field(() => BannerInput, { nullable: true })
  @Expose()
  data: BannerInput
}
