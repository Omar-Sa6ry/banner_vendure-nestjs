import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { Partner } from './entity/partner.entity'
import { PartnerService } from './partner.service'
import { RedisService } from 'src/common/redis/redis.service'
import { PartnerResponse, PartnersResponse } from './dto/partner.response'
import { partnerInput, PartnersInputResponse } from './input/partner.input'
import { Auth } from 'src/common/decerator/auth.decerator'
import { Role } from 'src/common/constant/enum.constant'

@Resolver(() => Partner)
export class PartnerResolver {
  constructor (
    private readonly redisService: RedisService,
    private readonly partnerService: PartnerService,
  ) {}

  @Mutation(() => PartnerResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async addPartner (
    @Args('campaignId', { type: () => Int }) campaignId: number,
    @Args('userId', { type: () => Int }) userId: number,
  ): Promise<PartnerResponse> {
    return await this.partnerService.add(campaignId, userId)
  }

  @Query(() => PartnerResponse)
  @Auth(Role.USER, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getPartnerById (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<PartnerResponse> {
    const partnerCacheKey = `partner:${id}`
    const cachedPartner = await this.redisService.get(partnerCacheKey)
    if (cachedPartner instanceof partnerInput) {
      return { data: cachedPartner }
    }

    return await this.partnerService.getById(id)
  }

  @Query(() => PartnersResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async partnersByCampaign (
    @Args('campaignId', { type: () => Int }) campaignId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<PartnersResponse> {
    const partnerCacheKey = `partner-campaign:${campaignId}`
    const cachedPartner = await this.redisService.get(partnerCacheKey)
    if (cachedPartner instanceof PartnersInputResponse) {
      return { ...cachedPartner }
    }

    return await this.partnerService.getpartnersByCampaign(
      campaignId,
      page,
      limit,
    )
  }

  @Query(() => PartnersResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async partnersByUser (
    @Args('userId', { type: () => Int }) userId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<PartnersResponse> {
    const partnerCacheKey = `partner-userId:${userId}`
    const cachedPartner = await this.redisService.get(partnerCacheKey)
    if (cachedPartner instanceof PartnersInputResponse) {
      return { ...cachedPartner }
    }

    return await this.partnerService.getPartnersByUser(userId, page, limit)
  }

  @Mutation(() => PartnerResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async deletePartner (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<PartnerResponse> {
    return await this.partnerService.delete(id)
  }
}
