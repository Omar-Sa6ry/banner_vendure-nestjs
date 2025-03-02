import { Field, InputType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { Post } from 'src/modules/post/entity/post.entity '
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class CommentInput {
  @Field()
  @IsInt()
  id: number

  @Field()
  @IsString()
  content: string

  @Field(() => Post)
  post: Post

  @Field(() => User)
  user: User

  @Field()
  @IsDate()
  createdAt: Date
}

@InputType()
export class CommentsInputResponse extends BaseResponse {
  @Field(() => [CommentInput], { nullable: true })
  @Expose()
  items: CommentInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@InputType()
export class CommentInputResponse extends BaseResponse {
  @Field(() => CommentInput, { nullable: true })
  @Expose()
  data: CommentInput
}
