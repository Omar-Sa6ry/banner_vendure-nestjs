import { Field, InputType } from '@nestjs/graphql'
import { IsInt, IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { BannerInput } from 'src/modules/banner/input/banner.input'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class InteractionInput {
  @Field()
  @IsInt()
  id: number

  @Field(() => String)
  type: string

  @Field(() => User)
  user: User

  @Field(() => BannerInput)
  banner: BannerInput

  @Field()
  createdAt: Date
}

@InputType()
export class InteractionInputResponse extends BaseResponse {
  @Field(() => InteractionInput, { nullable: true })
  data: InteractionInput
}

@InputType()
export class InteractionsInputResponse extends BaseResponse {
  @Field(() => [InteractionInput], { nullable: true })
  items: InteractionInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo
}
