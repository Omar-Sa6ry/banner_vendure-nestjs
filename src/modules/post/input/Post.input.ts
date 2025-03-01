import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator'
// import { Comment } from 'src/modules/comment/entity/comment.entity '
import { User } from 'src/modules/users/entity/user.entity'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { BaseResponse } from 'src/common/dtos/BaseResponse'

@InputType()
export class PostInput {
  @Field()
  @IsInt()
  id: number

  @Field()
  @IsString()
  content: string

  @Field()
  @IsString()
  imageUrl: string

  @Field(() => User)
  user: User

  // @Field()
  // likes: number

  // @Field(() => [Comment], { nullable: true })
  // comments: Comment[]

  @Field()
  @IsDate()
  createdAt: Date
}

@InputType()
export class PostsInputResponse extends BaseResponse {
  @Field(() => [PostInput], { nullable: true })
  items: PostInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo
}

@InputType()
export class PostInputResponse extends BaseResponse {
  @Field(() => PostInput, { nullable: true })
  data: PostInput
}
