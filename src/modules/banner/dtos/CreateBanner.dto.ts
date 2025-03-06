import { Field, InputType, Int } from '@nestjs/graphql'
import { IsInt, IsBoolean, IsUrl, Min, Max, IsOptional } from 'class-validator'

@InputType()
export class CreateBannerDto {
  @Field(() => Int)
  @IsInt()
  campaignId: number

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(12)
  position: number

  @Field(() => Int)
  @IsInt()
  page: number

  @Field(() => Int)
  @IsInt()
  price: number

  @Field()
  @IsUrl()
  url_ar: string

  @Field()
  @IsUrl()
  url_en: string

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  redirect?: string

  @Field(() => Boolean)
  @IsBoolean()
  isActive: boolean
}
