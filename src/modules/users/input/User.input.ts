import { Field, InputType, Int, ObjectType } from '@nestjs/graphql'
import { User } from 'src/modules/users/entity/user.entity'
import { BaseResponse } from 'src/common/dtos/BaseResponse'

@InputType()
export class UserInputResponse extends BaseResponse {
  @Field(() => User, { nullable: true })
  data: User
}

@InputType()
export class UserInput {
  @Field(() => Int)
  id: number

  @Field(() => String)
  userName: string

  @Field(() => String)
  bio: string

  @Field(() => String)
  phone: string

  @Field(() => String)
  email: string
}

@ObjectType()
export class UserOutput {
  @Field(() => Int)
  id: number

  @Field(() => String)
  userName: string

  @Field(() => String)
  bio: string

  @Field(() => String)
  phone: string

  @Field(() => String)
  email: string
}
