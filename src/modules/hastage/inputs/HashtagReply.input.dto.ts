import { Field, InputType } from '@nestjs/graphql'
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { ReplyInput } from 'src/modules/reply/input/reply.input'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class ReplyHastageInput {
  @Field()
  @IsInt()
  id: number

  @Field()
  @IsString()
  content: string

  @Field()
  @Field(() => ReplyInput)
  reply: ReplyInput

  @Field(() => User)
  user: User

  @Field()
  @IsDate()
  createdAt: Date
}

@InputType()
export class ReplyHastagesInputResponse extends BaseResponse {
  @Field(() => [ReplyHastageInput], { nullable: true })
  items: ReplyHastageInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo
}

@InputType()
export class ReplyHastageInputResponse extends BaseResponse {
  @Field(() => ReplyHastageInput, { nullable: true })
  data: ReplyHastageInput
}
