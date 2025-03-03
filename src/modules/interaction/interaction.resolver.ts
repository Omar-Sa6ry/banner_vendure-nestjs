import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { InteractionService } from './interaction.service'
import { RedisService } from 'src/common/redis/redis.service'
import {
  InteractionInput,
  InteractionInputResponse,
  InteractionsInputResponse,
} from './input/interaction.input'
import { CreateInteractionDto } from './dtos/CreateInteraction.dto'
import { Interaction } from './entity/interaction.entity'
import { Role } from 'src/common/constant/enum.constant'
import { Auth } from 'src/common/decerator/auth.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import {
  InteractionResponse,
  InteractionsResponse,
} from './dtos/Interaction.response'

@Resolver(() => Interaction)
export class InteractionResolver {
  constructor (
    private readonly redisService: RedisService,
    private readonly interactionService: InteractionService,
  ) {}

  @Mutation(() => InteractionResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async createInteraction (
    @CurrentUser() user: CurrentUserDto,
    @Args('data') data: CreateInteractionDto,
  ): Promise<InteractionResponse> {
    return await this.interactionService.create(user.id, data)
  }

  @Query(() => InteractionResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getInteractionById (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<InteractionResponse> {
    const InteractionCacheKey = `interaction:${id}`
    const cachedInteraction = await this.redisService.get(InteractionCacheKey)
    if (cachedInteraction instanceof InteractionInputResponse) {
      return { ...cachedInteraction }
    }

    return await this.interactionService.getById(id)
  }

  @Query(() => InteractionsResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async getInteractions (
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<InteractionsResponse> {
    return this.interactionService.get(page, limit)
  }

  @Query(() => InteractionsResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async getUserInteractionsByAdmin (
    @Args('userId', { type: () => Int }) userId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<InteractionsResponse> {
    const InteractionCacheKey = `interaction-user:${userId}`
    const cachedInteraction = await this.redisService.get(InteractionCacheKey)
    if (cachedInteraction instanceof InteractionsInputResponse) {
      return { ...cachedInteraction }
    }

    return await this.interactionService.getUserInteractions(
      userId,
      page,
      limit,
    )
  }

  @Query(() => InteractionsResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getUserInteractions (
    @CurrentUser() user: CurrentUserDto,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<InteractionsResponse> {
    const InteractionCacheKey = `interaction-user:${user.id}`
    const cachedInteraction = await this.redisService.get(InteractionCacheKey)
    if (cachedInteraction instanceof InteractionsInputResponse) {
      return { ...cachedInteraction }
    }

    return this.interactionService.getUserInteractions(user.id, page, limit)
  }

  @Query(() => InteractionResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async countAdViews (
    @Args('adId', { type: () => Int }) adId: number,
  ): Promise<InteractionResponse> {
    return await this.interactionService.countView(adId)
  }

  @Query(() => InteractionResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async countAdCkicks (
    @Args('adId', { type: () => Int }) adId: number,
  ): Promise<InteractionResponse> {
    return await this.interactionService.countClick(adId)
  }

  @Query(() => InteractionsResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getMostViews (
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<InteractionsResponse> {
    return this.interactionService.getMostViews(limit)
  }

  @Query(() => InteractionsResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getMostClicks (
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<InteractionsResponse> {
    return this.interactionService.getMostClicks(limit)
  }
}
