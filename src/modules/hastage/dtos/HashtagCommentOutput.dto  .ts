import { Field, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator'
import { User } from 'src/modules/users/entity/user.entity'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { CommentOutput } from 'src/modules/comment/dto/CommentResponse.dto'

@ObjectType()
export class CommentHastageOutput {
  @Field()
  @IsInt()
  id: number

  @Field()
  @IsString()
  content: string

  @Field()
  @Field(() => CommentOutput)
  commnet: CommentOutput

  @Field(() => User)
  user: User

  @Field()
  @IsDate()
  createdAt: Date
}

@ObjectType()
export class CommentHastagesResponse extends BaseResponse {
  @Field(() => [CommentHastageOutput], { nullable: true })
  @Expose()
  items: CommentHastageOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class CommentHastageResponse extends BaseResponse {
  @Field(() => CommentHastageOutput, { nullable: true })
  @Expose()
  data: CommentHastageOutput
}
