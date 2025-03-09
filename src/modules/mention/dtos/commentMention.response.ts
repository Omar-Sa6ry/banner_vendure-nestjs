import { Field, ObjectType } from '@nestjs/graphql'
import { IsDate, IsInt, IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { CommentOutput } from 'src/modules/comment/dto/CommentResponse.dto'
import { User } from 'src/modules/users/entity/user.entity'

@ObjectType()
export class CommentMentionOutput {
  @Field()
  @IsInt()
  id: number

  @Field(() => User)
  mentionFrom: User

  @Field(() => User)
  mentionTo: User

  @Field(() => CommentOutput)
  comment: CommentOutput

  @Field()
  @IsDate()
  createdAt: Date
}

@ObjectType()
export class CommentMentionsResponse extends BaseResponse {
  @Field(() => [CommentMentionOutput], { nullable: true })
  items: CommentMentionOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo
}

@ObjectType()
export class CommentMentionResponse extends BaseResponse {
  @Field(() => CommentMentionOutput, { nullable: true })
  data: CommentMentionOutput
}
