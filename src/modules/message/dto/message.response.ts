import { Field, ObjectType } from '@nestjs/graphql'
import { Expose, Transform } from 'class-transformer'
import { IsBoolean, IsDate, IsInt, IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { User } from 'src/modules/users/entity/user.entity'

@ObjectType()
export class MessageOutput {
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

@ObjectType()
export class MessagesResponse extends BaseResponse {
  @Field(() => [MessageOutput], { nullable: true })
  @Expose()
  items: MessageOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class MessageResponse extends BaseResponse {
  @Field(() => MessageOutput, { nullable: true })
  @Expose()
  data: MessageOutput
}
