import { Field, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsDate, IsInt, IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { ReplyOutPut } from 'src/modules/reply/dto/ReplyResponse.dto'
import { User } from 'src/modules/users/entity/user.entity'

@ObjectType()
export class ReplyLikeOutput {
  @Field()
  @IsInt()
  id: number

  @Field(() => ReplyOutPut)
  reply: ReplyOutPut

  @Field(() => User)
  user: User

  @Field()
  @IsDate()
  createdAt: Date
}

@ObjectType()
export class ReplyLikesResponse extends BaseResponse {
  @Field(() => [ReplyLikeOutput], { nullable: true })
  @Expose()
  items: ReplyLikeOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class ReplyLikeResponse extends BaseResponse {
  @Field(() => ReplyLikeOutput, { nullable: true })
  @Expose()
  data: ReplyLikeOutput
}
