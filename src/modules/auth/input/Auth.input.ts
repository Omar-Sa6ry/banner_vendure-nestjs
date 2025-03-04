import { Field, InputType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class AuthInput {
  @Field(() => User)
  @Expose()
  user: User

  @Field()
  @Expose()
  token: string
}

@InputType()
export class AuthsInputResponse extends BaseResponse {
  @Field(() => [AuthInput], { nullable: true })
  items: AuthInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo
}

@InputType()
export class AuthInputResponse extends BaseResponse {
  @Field(() => AuthInput, { nullable: true })
  data: AuthInput
}
