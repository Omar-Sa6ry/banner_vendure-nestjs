import { Field, InputType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsDate, IsInt, IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { ReplyInput } from 'src/modules/reply/input/reply.input'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class ReplyLikeInput {
  @Field()
  @IsInt()
  id: number

  @Field(() => ReplyInput)
  reply: ReplyInput

  @Field(() => User)
  user: User

  @Field()
  @IsDate()
  createdAt: Date
}

@InputType()
export class ReplyLikesInputResponse extends BaseResponse {
  @Field(() => [ReplyLikeInput], { nullable: true })
  @Expose()
  items: ReplyLikeInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@InputType()
export class ReplyLikeInputResponse extends BaseResponse {
  @Field(() => ReplyLikeInput, { nullable: true })
  @Expose()
  data: ReplyLikeInput
}
