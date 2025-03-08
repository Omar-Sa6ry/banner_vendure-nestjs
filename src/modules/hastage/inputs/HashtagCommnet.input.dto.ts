import { Field, InputType } from '@nestjs/graphql'
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { CommentInput } from 'src/modules/comment/input/comment.input'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class CommnetHastageInput {
  @Field()
  @IsInt()
  id: number

  @Field()
  @IsString()
  content: string

  @Field()
  @Field(() => CommentInput)
  commnet: CommentInput

  @Field(() => User)
  user: User

  @Field()
  @IsDate()
  createdAt: Date
}

@InputType()
export class CommnetHastagesInputResponse extends BaseResponse {
  @Field(() => [CommnetHastageInput], { nullable: true })
  items: CommnetHastageInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo
}

@InputType()
export class CommnetHastageInputResponse extends BaseResponse {
  @Field(() => CommnetHastageInput, { nullable: true })
  data: CommnetHastageInput
}
