import { Field, InputType } from '@nestjs/graphql'
import { IsInt, IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class BlockInput {
  @Field()
  @IsInt()
  id: number

  @Field(() => User)
  blocker: User

  @Field(() => User)
  blocking: User
}

@InputType()
export class BlocksResponseInput extends BaseResponse {
  @Field(() => [BlockInput], { nullable: true })
  items: BlockInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo
}

@InputType()
export class BlockInputResponse extends BaseResponse {
  @Field(() => BlockInput, { nullable: true })
  data: BlockInput
}
