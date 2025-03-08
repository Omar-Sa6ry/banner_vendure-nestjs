import { Field, InputType } from '@nestjs/graphql'
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { PostInput } from 'src/modules/post/input/Post.input'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class PostHastageInput {
  @Field()
  @IsInt()
  id: number

  @Field()
  @IsString()
  content: string

  @Field()
  @Field(() => PostInput)
  post: PostInput

  @Field(() => User)
  user: User

  @Field()
  @IsDate()
  createdAt: Date
}

@InputType()
export class PostHashtagsInputResponse extends BaseResponse {
  @Field(() => [PostHastageInput], { nullable: true })
  items: PostHastageInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo
}

@InputType()
export class PostHastageInputResponse extends BaseResponse {
  @Field(() => PostHastageInput, { nullable: true })
  data: PostHastageInput
}
