import { Field, InputType, Int, ObjectType } from '@nestjs/graphql'
import { IsOptional, IsString } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class FollowInput {
  @Field(() => Int)
  id: number

  @Field(() => Date)
  createdAt: Date

  @Field(() => User)
  follower: User

  @Field(() => User)
  following: User

  @Field()
  @IsString()
  status: string
}

@InputType()
export class FollowsInputResponse extends BaseResponse {
  @Field(() => [FollowInput], { nullable: true })
  items: FollowInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo
}

@InputType()
export class FollowInputResponse extends BaseResponse {
  @Field(() => FollowInput, { nullable: true })
  data: FollowInput
}
