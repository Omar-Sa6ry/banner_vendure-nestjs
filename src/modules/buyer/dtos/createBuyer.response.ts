import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { User } from 'src/modules/users/entity/user.entity'
import { Banner } from 'src/modules/banner/entity/bannner.entity'

@ObjectType()
export class CreateBuyer {
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

  @Field(() => String, { nullable: true })
  session: string
}

@ObjectType()
export class CreateBuyerResponse extends BaseResponse {
  @Field(() => CreateBuyer, { nullable: true })
  @Expose()
  data: CreateBuyer
}
