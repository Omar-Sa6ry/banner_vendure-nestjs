import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { CreateImagDto } from 'src/common/upload/dtos/createImage.dto'
import { BannerService } from './banner.service'
import { RedisService } from 'src/common/redis/redis.service'
import { Banner } from './entity/bannner.entity'
import { Role } from 'src/common/constant/enum.constant'
import { Auth } from 'src/common/decerator/auth.decerator'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { BannerResponse, BannersResponse } from './dtos/banner.response'
import { CreateBannerDto } from './dtos/CreateBanner.dto'
import { UpdateBannerDto } from './dtos/UpdateBanner.dto'

@Resolver(() => Banner)
export class BannerResolver {
  constructor (
    private readonly redisService: RedisService,
    private readonly bannerService: BannerService,
  ) {}

  @Mutation(() => BannerResponse)
  @Auth(Role.PARTNER)
  async createBanner (
    @CurrentUser() user: CurrentUserDto,
    @Args('createBannerDto') createBannerDto: CreateBannerDto,
    @Args('imageAr') imageAr: CreateImagDto,
    @Args('imageEn') imageEn: CreateImagDto,
  ): Promise<BannerResponse> {
    return await this.bannerService.create(
      user.id,
      createBannerDto,
      imageAr,
      imageEn,
    )
  }

  @Query(() => BannerResponse)
  async bannerById (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<BannerResponse> {
    const bannerCacheKey = `banner:${id}`
    const cachedbanner = await this.redisService.get(bannerCacheKey)
    if (cachedbanner instanceof BannerResponse) {
      return { ...cachedbanner }
    }

    return await this.bannerService.getById(id)
  }

  @Query(() => BannersResponse)
  async bannersByCampaign (
    @Args('campaignId', { type: () => Int }) campaignId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<BannersResponse> {
    const bannerCacheKey = `banner-campaign:${campaignId}`
    const cachedbanner = await this.redisService.get(bannerCacheKey)
    if (cachedbanner instanceof BannersResponse) {
      return { ...cachedbanner }
    }

    return await this.bannerService.getByCampaign(campaignId, page, limit)
  }

  @Query(() => BannersResponse)
  async getBanners (
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<BannersResponse> {
    return await this.bannerService.get(page, limit)
  }

  @Mutation(() => BannerResponse)
  @Auth(Role.PARTNER)
  async updateBanner (
    @CurrentUser() user: CurrentUserDto,
    @Args('id', { type: () => Int }) id: number,
    @Args('campaignId', { type: () => Int }) campaignId: number,
    @Args('updateBannerDto') updateBannerDto: UpdateBannerDto,
  ): Promise<BannerResponse> {
    return await this.bannerService.update(
      id,
      user.id,
      campaignId,
      updateBannerDto,
    )
  }

  @Mutation(() => BannerResponse)
  @Auth(Role.PARTNER)
  async deleteBanner (
    @CurrentUser() user: CurrentUserDto,
    @Args('id', { type: () => Int }) id: number,
    @Args('campaignId', { type: () => Int }) campaignId: number,
  ): Promise<BannerResponse> {
    return await this.bannerService.delete(id, user.id, campaignId)
  }
}
