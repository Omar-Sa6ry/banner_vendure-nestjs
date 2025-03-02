import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { User } from 'src/modules/users/entity/user.entity'

@ObjectType()
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

  @Field(() => Int)
  likes: number

  @Field(() => [Comment], { nullable: true })
  comments: Comment[]

  @Field()
  @IsDate()
  createdAt: Date
}

@ObjectType()
export class PostsResponse extends BaseResponse {
  @Field(() => [PostInput], { nullable: true })
  @Expose()
  items: PostInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class PostResponse extends BaseResponse {
  @Field(() => PostInput, { nullable: true })
  @Expose()
  data: PostInput
}
