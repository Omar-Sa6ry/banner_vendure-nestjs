import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { IsInt, IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { User } from 'src/modules/users/entity/user.entity'
import { BannerOutput } from 'src/modules/banner/dtos/banner.response'
import { BannerInput } from 'src/modules/banner/input/banner.input'

@ObjectType()
export class InteractionOutput {
  @Field()
  @IsInt()
  id: number

  @Field(() => String)
  type: string

  @Field(() => User)
  user: User

  @Field(() => BannerOutput)
  banner: BannerInput

  @Field()
  createdAt: Date
}

@ObjectType()
export class InteractionsResponse extends BaseResponse {
  @Field(() => [InteractionOutput], { nullable: true })
  @Expose()
  items: InteractionOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class InteractionResponse extends BaseResponse {
  @Field(() => InteractionOutput, { nullable: true })
  @Expose()
  data: InteractionOutput
}
