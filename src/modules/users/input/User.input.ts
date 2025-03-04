import { Field, InputType, Int, ObjectType } from '@nestjs/graphql'
import { User } from 'src/modules/users/entity/user.entity'
import { BaseResponse } from 'src/common/dtos/BaseResponse'

@InputType()
export class UserInputResponse extends BaseResponse {
  @Field(() => User, { nullable: true })
  data: User
}
