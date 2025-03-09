import { Field, InputType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsDate, IsInt, IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { PostInput } from 'src/modules/post/input/Post.input'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class PostMentionInput {
  @Field()
  @IsInt()
  id: number

  @Field(() => User)
  mentionFrom: User

  @Field(() => User)
  mentionTo: User

  @Field(() => PostInput)
  post: PostInput

  @Field()
  @IsDate()
  createdAt: Date
}

@InputType()
export class PostMentionsInputResponse extends BaseResponse {
  @Field(() => [PostMentionInput], { nullable: true })
  @Expose()
  items: PostMentionInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@InputType()
export class PostMentionInputResponse extends BaseResponse {
  @Field(() => PostMentionInput, { nullable: true })
  @Expose()
  data: PostMentionInput
}
