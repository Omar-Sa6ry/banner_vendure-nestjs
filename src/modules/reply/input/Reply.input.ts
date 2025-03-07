import { Field, InputType, Int } from '@nestjs/graphql'
import { IsOptional, IsString } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class ReplyInput {
  @Field(() => Int)
  id: number

  @Field()
  @IsString()
  content: string

  @Field(() => Comment)
  comment: Comment

  @Field(() => User)
  user: User

  @Field(() => Date)
  createdAt: Date
}

@InputType()
export class ReplysInputResponse extends BaseResponse {
  @Field(() => [ReplyInput], { nullable: true })
  items: ReplyInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo
}

@InputType()
export class ReplyInputResponse extends BaseResponse {
  @Field(() => ReplyInput, { nullable: true })
  data: ReplyInput
}
