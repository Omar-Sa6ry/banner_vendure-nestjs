import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { User } from 'src/modules/users/entity/user.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'

@ObjectType()
export class partnerOutput {
  @Field(() => Int)
  id: number

  @Field(() => Date)
  createdAt: Date

  @Field(() => Campaign)
  campaign: Campaign

  @Field(() => User)
  user: User
}

@ObjectType()
export class PartnersResponse extends BaseResponse {
  @Field(() => [partnerOutput], { nullable: true })
  @Expose()
  items: partnerOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class PartnerResponse extends BaseResponse {
  @Field(() => partnerOutput, { nullable: true })
  @Expose()
  data: partnerOutput
}
