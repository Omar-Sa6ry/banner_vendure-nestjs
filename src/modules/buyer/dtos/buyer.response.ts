import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { User } from 'src/modules/users/entity/user.entity'
import { Banner } from 'src/modules/banner/entity/bannner.entity'

@ObjectType()
export class BuyerOutput {
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

@ObjectType()
export class BuyersResponse extends BaseResponse {
  @Field(() => [BuyerOutput], { nullable: true })
  @Expose()
  items: BuyerOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class BuyerResponse extends BaseResponse {
  @Field(() => BuyerOutput, { nullable: true })
  @Expose()
  data: BuyerOutput
}
