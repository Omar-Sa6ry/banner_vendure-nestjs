import { Field, ObjectType, Int } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { User } from 'src/modules/users/entity/user.entity'
import { CampaignInput } from 'src/modules/campaign/input/campain.input'

@ObjectType()
export class BannerOutput {
  @Field(() => Int)
  position: number

  @Field(() => Int)
  page: number

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
  is_active: boolean

  @Field(() => Date)
  createdAt: Date

  @Field(() => User)
  createdBy: User

  @Field(() => CampaignInput)
  campaign: CampaignInput
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
