import { Field, InputType, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { CampaignStatus } from 'src/common/constant/enum.constant'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class CampaignInput {
  @Field(() => Int)
  id: number

  @Field(() => String)
  name: string

  @Field(() => String)
  description: string

  @Field(() => CampaignStatus)
  status: CampaignStatus

  @Field(() => Date)
  startDate: Date

  @Field(() => Date)
  endDate: Date

  @Field(() => Date)
  createdAt: Date

  @Field(() => User)
  user: User
}

@InputType()
export class CampaignsInputResponse extends BaseResponse {
  @Field(() => [CampaignInput], { nullable: true })
  @Expose()
  items: CampaignInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@InputType()
export class CampaignInputResponse extends BaseResponse {
  @Field(() => CampaignInput, { nullable: true })
  @Expose()
  data: CampaignInput
}
