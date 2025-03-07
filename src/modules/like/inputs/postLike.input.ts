import { Field, InputType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { PostInput } from 'src/modules/post/input/Post.input'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class LikeInput {
  @Field()
  @IsInt()
  id: number

  @Field(() => PostInput)
  post: PostInput

  @Field(() => User)
  user: User

  @Field()
  @IsDate()
  createdAt: Date
}

@InputType()
export class LikesInputResponse extends BaseResponse {
  @Field(() => [LikeInput], { nullable: true })
  @Expose()
  items: LikeInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@InputType()
export class LikeInputResponse extends BaseResponse {
  @Field(() => LikeInput, { nullable: true })
  @Expose()
  data: LikeInput
}
