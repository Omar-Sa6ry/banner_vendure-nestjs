import { Field, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsDate, IsInt, IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { CommentOutput } from 'src/modules/comment/dto/CommentResponse.dto'
import { User } from 'src/modules/users/entity/user.entity'

@ObjectType()
export class CommentLikeOutput {
  @Field()
  @IsInt()
  id: number

  @Field(() => CommentOutput)
  comment: CommentOutput

  @Field(() => User)
  user: User

  @Field()
  @IsDate()
  createdAt: Date
}

@ObjectType()
export class CommentLikesResponse extends BaseResponse {
  @Field(() => [CommentLikeOutput], { nullable: true })
  @Expose()
  items: CommentLikeOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class CommentLikeResponse extends BaseResponse {
  @Field(() => CommentLikeOutput, { nullable: true })
  @Expose()
  data: CommentLikeOutput
}
