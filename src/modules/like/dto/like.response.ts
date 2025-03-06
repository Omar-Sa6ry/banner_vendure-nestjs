import { Field, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { PostOutput } from 'src/modules/post/dto/PostResponse.dto'
import { PostInput } from 'src/modules/post/input/Post.input'
import { User } from 'src/modules/users/entity/user.entity'

@ObjectType()
export class LikeOutput {
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
  @Field(() => [LikeOutput], { nullable: true })
  @Expose()
  items: LikeOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class LikeResponse extends BaseResponse {
  @Field(() => LikeOutput, { nullable: true })
  @Expose()
  data: LikeOutput
}
