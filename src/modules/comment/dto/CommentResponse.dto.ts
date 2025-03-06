import { Field, ObjectType } from '@nestjs/graphql'
import { Expose, Transform } from 'class-transformer'
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { PostOutput } from 'src/modules/post/dto/PostResponse.dto'
import { PostInput } from 'src/modules/post/input/Post.input'
import { User } from 'src/modules/users/entity/user.entity'

@ObjectType()
export class CommentOutput {
  @Field()
  @IsInt()
  @Expose()
  id: number

  @Field()
  @IsString()
  @Expose()
  content: string

  @Field(() => PostOutput)
  @Expose()
  post: PostInput

  @Field(() => User)
  @Expose()
  user: User

  @Field()
  @IsDate()
  @Expose()
  @Transform(({ value }) => new Date(value).toLocaleString(), {
    toClassOnly: true,
  })
  createdAt: Date
}

@ObjectType()
export class CommentsResponse extends BaseResponse {
  @Field(() => [CommentOutput], { nullable: true })
  @Expose()
  items: CommentOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class CommentResponse extends BaseResponse {
  @Field(() => CommentOutput, { nullable: true })
  @Expose()
  data: CommentOutput
}
