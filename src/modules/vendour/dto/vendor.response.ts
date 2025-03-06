import { Field, ObjectType } from '@nestjs/graphql'
import { IsDate, IsInt, IsOptional } from 'class-validator'
import { User } from 'src/modules/users/entity/user.entity'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { Banner } from 'src/modules/banner/entity/bannner.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'

@ObjectType()
export class VendorOutput {
  @Field()
  @IsInt()
  id: number

  @Field(() => Banner)
  banner: Banner

  @Field(() => User)
  user: User

  @Field(() => Campaign)
  campaign: Campaign

  @Field()
  @IsDate()
  createdAt: Date
}

@ObjectType()
export class VendorsResponse extends BaseResponse {
  @Field(() => [VendorOutput], { nullable: true })
  items: VendorOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo
}

@ObjectType()
export class VendorResponse extends BaseResponse {
  @Field(() => VendorOutput, { nullable: true })
  data: VendorOutput
}
