import { Field, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsDate, IsInt, IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { PostOutput } from 'src/modules/post/dto/PostResponse.dto'
import { PostInput } from 'src/modules/post/input/Post.input'
import { User } from 'src/modules/users/entity/user.entity'

@ObjectType()
export class PostLikeOutput {
  @Field()
  @IsInt()
  id: number

  @Field(() => PostOutput)
  post: PostInput

  @Field(() => User)
  user: User

  @Field()
  @IsDate()
  createdAt: Date
}

@ObjectType()
export class LikesResponse extends BaseResponse {
  @Field(() => [PostLikeOutput], { nullable: true })
  @Expose()
  items: PostLikeOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class LikeResponse extends BaseResponse {
  @Field(() => PostLikeOutput, { nullable: true })
  @Expose()
  data: PostLikeOutput
}
