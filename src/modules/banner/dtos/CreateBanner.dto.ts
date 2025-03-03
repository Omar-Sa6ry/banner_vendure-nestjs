import { IsInt, IsBoolean, IsUrl, Min, Max, IsOptional } from 'class-validator'

export class CreateBannerDto {
  @IsInt()
  campaignId: number

  @IsInt()
  @Min(1)
  @Max(12)
  position: number

  @IsInt()
  page: number

  @IsUrl()
  url_ar: string

  @IsUrl()
  url_en: string

  @IsOptional()
  @IsUrl()
  redirect?: string

  @IsBoolean()
  is_active: boolean
}
