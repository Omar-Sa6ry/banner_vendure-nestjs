import { Field, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsInt, IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { User } from 'src/modules/users/entity/user.entity'

@ObjectType()
export class BlockOutput {
  @Field()
  @IsInt()
  id: number

  @Field(() => User)
  blocker: User

  @Field(() => User)
  blocking: User
}

@ObjectType()
export class BlocksResponse extends BaseResponse {
  @Field(() => [BlockOutput], { nullable: true })
  @Expose()
  items: BlockOutput[]

  @IsOptional()
  @Expose()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo
}

@ObjectType()
export class BlockResponse extends BaseResponse {
  @Field(() => BlockOutput, { nullable: true })
  @Expose()
  data: BlockOutput
}
