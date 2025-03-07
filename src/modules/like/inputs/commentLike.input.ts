import { Field, InputType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsDate, IsInt, IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { CommentInput } from 'src/modules/comment/input/comment.input'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class CommentLikeInput {
  @Field()
  @IsInt()
  id: number

  @Field(() => CommentInput)
  comment: CommentInput

  @Field(() => User)
  user: User

  @Field()
  @IsDate()
  createdAt: Date
}

@InputType()
export class CommentLikesInputResponse extends BaseResponse {
  @Field(() => [CommentLikeInput], { nullable: true })
  @Expose()
  items: CommentLikeInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@InputType()
export class CommentLikeInputResponse extends BaseResponse {
  @Field(() => CommentLikeInput, { nullable: true })
  @Expose()
  data: CommentLikeInput
}
