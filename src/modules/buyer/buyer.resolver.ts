import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { BuyerService } from './buyer.service'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { Auth } from 'src/common/decerator/auth.decerator'
import { Role } from 'src/common/constant/enum.constant'
import { RedisService } from 'src/common/redis/redis.service'
import { CreateBuyerResponse } from './dtos/createBuyer.response'
import { BuyerResponse, BuyersResponse } from './dtos/buyer.response'
import { BuyerInputResponse, BuyersInputResponse } from './input/buyer.input'

@Resolver()
export class BuyerResolver {
  constructor (
    private readonly redisService: RedisService,
    private readonly buyerService: BuyerService,
  ) {}

  @Mutation(() => CreateBuyerResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async createBuyer (
    @CurrentUser() user: CurrentUserDto,
    @Args('bannerId', { type: () => Int }) bannerId: number,
  ): Promise<CreateBuyerResponse> {
    return await this.buyerService.create(bannerId, user.id)
  }

  @Query(() => BuyerResponse)
  @Auth(Role.VENDOR, Role.ADMIN, Role.MANAGER)
  async getBuyer (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<BuyerResponse> {
    const buyerCacheKey = `buyer:${id}`
    const cachedbuyer = await this.redisService.get(buyerCacheKey)
    if (cachedbuyer instanceof BuyerInputResponse) {
      return { ...cachedbuyer }
    }

    return this.buyerService.findOne(id)
  }

  @Query(() => BuyersResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async getAllBuyers (
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<BuyersResponse> {
    return this.buyerService.findAll(page, limit)
  }

  @Query(() => BuyersResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getBuyersByBannerId (
    @Args('bannerId', { type: () => Int }) bannerId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<BuyersResponse> {
    const buyerCacheKey = `buyer-banner:${bannerId}`
    const cachedbuyer = await this.redisService.get(buyerCacheKey)
    if (cachedbuyer instanceof BuyersInputResponse) {
      return { ...cachedbuyer }
    }

    return this.buyerService.findByBannerId(bannerId, page, limit)
  }

  @Query(() => BuyersResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getBuyersByUserId (
    @Args('userId', { type: () => Int }) userId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<BuyersResponse> {
    const buyerCacheKey = `buyer-user:${userId}`
    const cachedbuyer = await this.redisService.get(buyerCacheKey)
    if (cachedbuyer instanceof BuyersInputResponse) {
      return { ...cachedbuyer }
    }

    return this.buyerService.findByUserId(userId, page, limit)
  }

  @Mutation(() => BuyerResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async deleteBuyer (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<BuyerResponse> {
    return this.buyerService.delete(id)
  }
}
