import { Field, InputType } from '@nestjs/graphql'
import { PasswordValidator } from 'src/common/constant/messages.constant'
import {
  IsEmail,
  IsString,
  IsPhoneNumber,
  IsLowercase,
  Length,
} from 'class-validator'

@InputType()
export class CreateUserDto {
  @Field()
  @IsString()
  userName: string

  @Field()
  @IsEmail()
  @IsLowercase()
  email: string

  @Field()
  @IsString()
  @Length(8, 16, { message: PasswordValidator })
  password: string

  @Field()
  @IsPhoneNumber()
  phone: string
}
