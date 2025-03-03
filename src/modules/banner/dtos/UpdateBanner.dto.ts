import { IsInt, IsBoolean, IsUrl, Min, Max, IsOptional } from 'class-validator'

export class UpdateBannerDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  position?: number

  @IsOptional()
  @IsInt()
  page?: number

  @IsOptional()
  @IsUrl()
  url_ar?: string

  @IsOptional()
  @IsUrl()
  url_en?: string

  @IsOptional()
  @IsUrl()
  redirect?: string

  @IsOptional()
  @IsBoolean()
  is_active?: boolean
}
