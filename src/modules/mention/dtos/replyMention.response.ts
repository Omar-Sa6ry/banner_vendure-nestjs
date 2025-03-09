import { Field, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsDate, IsInt, IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { ReplyOutPut } from 'src/modules/reply/dto/ReplyResponse.dto'
import { User } from 'src/modules/users/entity/user.entity'

@ObjectType()
export class ReplyMentionInput {
  @Field()
  @IsInt()
  id: number

  @Field(() => User)
  mentionFrom: User

  @Field(() => User)
  mentionTo: User

  @Field(() => ReplyOutPut)
  reply: ReplyOutPut

  @Field()
  @IsDate()
  createdAt: Date
}

@ObjectType()
export class ReplyMentionsResponse extends BaseResponse {
  @Field(() => [ReplyMentionInput], { nullable: true })
  @Expose()
  items: ReplyMentionInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class ReplyMentionResponse extends BaseResponse {
  @Field(() => ReplyMentionInput, { nullable: true })
  @Expose()
  data: ReplyMentionInput
}
