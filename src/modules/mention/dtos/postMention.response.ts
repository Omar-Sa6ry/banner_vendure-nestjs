import { Field, ObjectType } from '@nestjs/graphql'
import { Transform } from 'class-transformer'
import { IsDate, IsInt, IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { PostOutput } from 'src/modules/post/dto/PostResponse.dto'
import { User } from 'src/modules/users/entity/user.entity'

@ObjectType()
export class PostMentionOutput {
  @Field()
  @IsInt()
  id: number

  @Field(() => User)
  mentionFrom: User

  @Field(() => User)
  mentionTo: User

  @Field(() => PostOutput)
  post: PostOutput

  @Field()
  @IsDate()
  @Transform(({ value }) => new Date(value).toLocaleString(), {
    toClassOnly: true,
  })
  createdAt: Date
}

@ObjectType()
export class PostMentionsResponse extends BaseResponse {
  @Field(() => [PostMentionOutput], { nullable: true })
  items: PostMentionOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo
}

@ObjectType()
export class PostMentionResponse extends BaseResponse {
  @Field(() => PostMentionOutput, { nullable: true })
  data: PostMentionOutput
}
