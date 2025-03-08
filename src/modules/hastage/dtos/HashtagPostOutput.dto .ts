import { Field, ObjectType } from '@nestjs/graphql'
import { Expose, Transform } from 'class-transformer'
import { User } from 'src/modules/users/entity/user.entity'
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { PostOutput } from 'src/modules/post/dto/PostResponse.dto'

@ObjectType()
export class PostHastageOutPut {
  @Field()
  @IsInt()
  @Expose()
  id: number

  @Field()
  @IsString()
  @Expose()
  content: string

  @Field()
  @Field(() => PostOutput)
  @Expose()
  post: PostOutput

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
export class PostHastagesResponse extends BaseResponse {
  @Field(() => [PostHastageOutPut], { nullable: true })
  @Expose()
  items: PostHastageOutPut[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class PostHastageResponse extends BaseResponse {
  @Field(() => PostHastageOutPut, { nullable: true })
  @Expose()
  data: PostHastageOutPut
}
