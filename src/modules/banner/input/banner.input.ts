import { Field, InputType, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { CampaignInput } from 'src/modules/campaign/input/campain.input'
import { Partner } from 'src/modules/partner/entity/partner.entity'

@InputType()
export class BannerInput {
  @Field(() => Int)
  id: number

  @Field(() => Int)
  position: number

  @Field(() => Int)
  price: number

  @Field(() => Int)
  page: number

  @Field(() => Int, { nullable: true })
  clicks: number

  @Field(() => Int, { nullable: true })
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
  @Field(() => String, { nullable: true })
  redirect?: string

  @Field(() => Boolean)
  isActive: boolean

  @Field(() => Date)
  createdAt: Date

  @Field(() => Partner)
  createdBy: Partner

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
