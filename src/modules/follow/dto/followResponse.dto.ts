import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsOptional, IsString } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { User } from 'src/modules/users/entity/user.entity'

@ObjectType()
export class FollowOutput {
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

@ObjectType()
export class FollowsResponse extends BaseResponse {
  @Field(() => [FollowOutput], { nullable: true })
  @Expose()
  items: FollowOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class FollowResponse extends BaseResponse {
  @Field(() => FollowOutput, { nullable: true })
  @Expose()
  data: FollowOutput
}
