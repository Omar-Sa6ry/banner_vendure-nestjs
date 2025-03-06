import { Field, InputType, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { User } from 'src/modules/users/entity/user.entity'
import { Banner } from 'src/modules/banner/entity/bannner.entity'

@InputType()
export class BuyerInput {
  @Field(() => Int)
  id: number

  @Field(() => String)
  paymentMethod: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => User)
  user: User

  @Field(() => Banner)
  banner: Banner
}

@InputType()
export class BuyersInputResponse extends BaseResponse {
  @Field(() => [BuyerInput], { nullable: true })
  @Expose()
  items: BuyerInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@InputType()
export class BuyerInputResponse extends BaseResponse {
  @Field(() => BuyerInput, { nullable: true })
  @Expose()
  data: BuyerInput
}
