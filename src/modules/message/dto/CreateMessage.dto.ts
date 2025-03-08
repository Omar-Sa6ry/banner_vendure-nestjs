import { Field, InputType } from '@nestjs/graphql'
import { IsInt, IsString } from 'class-validator'

@InputType()
export class CreateMessageDto {
  @Field()
  @IsString()
  content: string

  @Field()
  @IsInt()
  receiverId: number
}
