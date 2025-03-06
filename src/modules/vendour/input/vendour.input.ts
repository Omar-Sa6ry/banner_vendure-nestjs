import { Field, InputType } from '@nestjs/graphql'
import { IsDate, IsInt, IsOptional } from 'class-validator'
import { User } from 'src/modules/users/entity/user.entity'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { Banner } from 'src/modules/banner/entity/bannner.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'

@InputType()
export class VendorInput {
  @Field()
  @IsInt()
  id: number

  @Field(() => Banner)
  banner: Banner

  @Field(() => Campaign)
  campaign: Campaign

  @Field(() => User)
  user: User

  @Field()
  @IsDate()
  createdAt: Date
}

@InputType()
export class VendorsInputResponse extends BaseResponse {
  @Field(() => [VendorInput], { nullable: true })
  items: VendorInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo
}

@InputType()
export class VendorInputResponse extends BaseResponse {
  @Field(() => VendorInput, { nullable: true })
  data: VendorInput
}
