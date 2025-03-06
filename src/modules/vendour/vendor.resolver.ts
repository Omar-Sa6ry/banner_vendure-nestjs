import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { Vendor } from './entity/vendour.entity'
import {
  VendorOutput,
  VendorResponse,
  VendorsResponse,
} from './dto/vendor.response'
import { VendorService } from './vendour.service'
import { RedisService } from 'src/common/redis/redis.service'
import { UserResponse } from '../users/dtos/UserResponse.dto'
import { Auth } from 'src/common/decerator/auth.decerator'
import { Role } from 'src/common/constant/enum.constant'

@Resolver(() => Vendor)
export class VendorResolver {
  constructor (
    private readonly redisService: RedisService,
    private readonly vendorService: VendorService,
  ) {}

  @Mutation(() => VendorResponse)
  @Auth(Role.VENDOR)
  async createVendor (
    @Args('bannerId', { type: () => Int }) bannerId: number,
    @Args('campaignId', { type: () => Int }) campaignId: number,
    @Args('userId', { type: () => Int }) userId: number,
  ): Promise<VendorResponse> {
    return this.vendorService.create(bannerId, userId, campaignId)
  }

  @Query(() => VendorResponse)
  async getVendorById (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<VendorResponse> {
    const VendorCacheKey = `vendor:${id}`
    const cachedVendor = await this.redisService.get(VendorCacheKey)
    if (cachedVendor instanceof VendorResponse) {
      return { ...cachedVendor }
    }

    return this.vendorService.getById(id)
  }

  @Query(() => VendorsResponse)
  async getVendors (
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<VendorsResponse> {
    return this.vendorService.get(page, limit)
  }

  @Query(() => UserResponse)
  async getBannerVendor (
    @Args('bannerId', { type: () => Int }) bannerId: number,
  ): Promise<UserResponse> {
    const VendorCacheKey = `banner-vendor:${bannerId}`
    const cachedVendor = await this.redisService.get(VendorCacheKey)
    if (cachedVendor instanceof UserResponse) {
      return { ...cachedVendor }
    }

    return this.vendorService.getBannerVendor(bannerId)
  }

  @Query(() => VendorsResponse)
  async getUserVendor (
    @Args('userId', { type: () => Int }) userId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<VendorsResponse> {
    const VendorCacheKey = `user-vendor:${userId}`
    const cachedVendor = await this.redisService.get(VendorCacheKey)
    if (cachedVendor instanceof VendorsResponse) {
      return { ...cachedVendor }
    }

    return await this.vendorService.getUserVendor(userId, page, limit)
  }

  @Mutation(() => VendorResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async deleteVendor (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<VendorResponse> {
    return this.vendorService.delete(id)
  }
}
