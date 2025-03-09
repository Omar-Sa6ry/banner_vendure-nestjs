import { Field, InputType } from '@nestjs/graphql'
import { Expose, Transform } from 'class-transformer'
import { IsDate, IsInt, IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { CommentInput } from 'src/modules/comment/input/comment.input'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class CommentMentionInput {
  @Field()
  @IsInt()
  id: number

  @Field(() => User)
  mentionFrom: User

  @Field(() => User)
  mentionTo: User

  @Field(() => CommentInput)
  comment: CommentInput

  @Field()
  @IsDate()
  createdAt: Date
}

@InputType()
export class CommentMentionsInputResponse extends BaseResponse {
  @Field(() => [CommentMentionInput], { nullable: true })
  @Expose()
  items: CommentMentionInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@InputType()
export class CommentMentionInputResponse extends BaseResponse {
  @Field(() => CommentMentionInput, { nullable: true })
  @Expose()
  data: CommentMentionInput
}
