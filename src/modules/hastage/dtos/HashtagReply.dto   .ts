import { Field, ObjectType } from '@nestjs/graphql'
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator'
import { User } from 'src/modules/users/entity/user.entity'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { ReplyOutPut } from 'src/modules/reply/dto/ReplyResponse.dto'

@ObjectType()
export class ReplyHastageOutput {
  @Field()
  @IsInt()
  id: number

  @Field()
  @IsString()
  content: string

  @Field()
  @Field(() => ReplyOutPut)
  reply: ReplyOutPut

  @Field(() => User)
  user: User

  @Field()
  @IsDate()
  createdAt: Date
}

@ObjectType()
export class ReplyHastagesResponse extends BaseResponse {
  @Field(() => [ReplyHastageOutput], { nullable: true })
  @Expose()
  items: ReplyHastageOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class ReplyHastageResponse extends BaseResponse {
  @Field(() => ReplyHastageOutput, { nullable: true })
  @Expose()
  data: ReplyHastageOutput
}
