import { Field, InputType, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { User } from 'src/modules/users/entity/user.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'

@InputType()
export class partnerInput {
  @Field(() => Int)
  id: number

  @Field(() => Date)
  createdAt: Date

  @Field(() => Campaign)
  campaign: Campaign

  @Field(() => User)
  user: User
}

@InputType()
export class PartnersInputResponse extends BaseResponse {
  @Field(() => [partnerInput], { nullable: true })
  @Expose()
  items: partnerInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@InputType()
export class PartnerInputResponse extends BaseResponse {
  @Field(() => partnerInput, { nullable: true })
  @Expose()
  data: partnerInput
}
