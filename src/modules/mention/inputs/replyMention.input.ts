import { Field, InputType } from '@nestjs/graphql'
import { Expose, Transform } from 'class-transformer'
import { IsDate, IsInt, IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { ReplyInput } from 'src/modules/reply/input/reply.input'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class ReplyMentionInput {
  @Field()
  @IsInt()
  id: number

  @Field(() => User)
  mentionFrom: User

  @Field(() => User)
  mentionTo: User

  @Field(() => ReplyInput)
  reply: ReplyInput

  @Field()
  @IsDate()
  createdAt: Date
}

@InputType()
export class ReplyMentionsInputResponse extends BaseResponse {
  @Field(() => [ReplyMentionInput], { nullable: true })
  @Expose()
  items: ReplyMentionInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@InputType()
export class ReplyMentionInputResponse extends BaseResponse {
  @Field(() => ReplyMentionInput, { nullable: true })
  @Expose()
  data: ReplyMentionInput
}
