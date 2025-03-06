import { Field, ObjectType, Int } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { CampaignOutput } from 'src/modules/campaign/dtos/CampaignResponse'
import { Partner } from 'src/modules/partner/entity/partner.entity'

@ObjectType()
export class BannerOutput {
  @Field(() => Int)
  id: number

  @Field(() => Int)
  position: number

  @Field(() => Int)
  price: number

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
  @Field(() => String, { nullable: true })
  redirect?: string

  @Field(() => Boolean)
  isActive: boolean

  @Field(() => Date)
  createdAt: Date

  @Field(() => Partner)
  createdBy: Partner

  @Field(() => CampaignOutput)
  campaign: CampaignOutput
}

@ObjectType()
export class BannersResponse extends BaseResponse {
  @Field(() => [BannerOutput], { nullable: true })
  @Expose()
  items: BannerOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class BannerResponse extends BaseResponse {
  @Field(() => BannerOutput, { nullable: true })
  @Expose()
  data: BannerOutput
}
