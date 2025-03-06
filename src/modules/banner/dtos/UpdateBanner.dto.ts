import { Field, InputType, Int } from '@nestjs/graphql'
import { IsInt, IsBoolean, IsUrl, Min, Max, IsOptional } from 'class-validator'

@InputType()
export class UpdateBannerDto {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  position?: number

  @IsOptional()
  @Field(() => Int)
  @IsInt()
  price?: number

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  page?: number

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  url_ar?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  url_en?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  redirect?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
