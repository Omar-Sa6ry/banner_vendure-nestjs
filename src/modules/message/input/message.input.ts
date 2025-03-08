import { Field, InputType } from '@nestjs/graphql'
import { IsBoolean, IsDate, IsInt, IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class messageInput {
  @Field()
  @IsInt()
  id: number

  @Field()
  content: string

  @Field()
  @IsBoolean()
  isRead: boolean

  @Field(() => User)
  sender: User

  @Field(() => User)
  receiver: User

  @Field()
  @IsDate()
  createdAt: Date
}

@InputType()
export class messagesInputResponse extends BaseResponse {
  @Field(() => [messageInput], { nullable: true })
  items: messageInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo
}

@InputType()
export class messageInputResponse extends BaseResponse {
  @Field(() => messageInput, { nullable: true })
  data: messageInput
}
