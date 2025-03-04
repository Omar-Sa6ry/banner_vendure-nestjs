import { Field, InputType, Int, ObjectType } from '@nestjs/graphql'
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator'
import { User } from 'src/modules/users/entity/user.entity'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { Banner } from 'src/modules/banner/entity/bannner.entity'

@InputType()
export class PostInput {
  @Field()
  @IsInt()
  id: number

  @Field()
  @IsString()
  content: string

  @Field(() => Banner)
  banner: Banner

  @Field(() => User, { nullable: true })
  user: User

  @Field(() => Int, { nullable: true })
  likes: number

  @Field(() => [Comment], { nullable: true })
  comments: Comment[]

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
