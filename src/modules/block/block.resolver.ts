import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { BlockService } from './block.service'
import { Role } from 'src/common/constant/enum.constant'
import { Auth } from 'src/common/decerator/auth.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { Block } from './entity/block.entity'
import { BlockResponse, BlocksResponse } from './dto/Block.response.dto'

@Resolver(() => Block)
export class BlockResolver {
  constructor (private readonly blockService: BlockService) {}

  @Mutation(() => BlockResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async blockUser (
    @CurrentUser() user: CurrentUserDto,
    @Args('blockingId', { type: () => Int }) blockingId: number,
  ): Promise<BlockResponse> {
    return this.blockService.block(user.id, blockingId)
  }

  @Mutation(() => BlockResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async unblockUser (
    @CurrentUser() user: CurrentUserDto,
    @Args('blockingId', { type: () => Int }) blockingId: number,
  ): Promise<BlockResponse> {
    return this.blockService.unblock(user.id, blockingId)
  }

  @Query(() => BlocksResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getBlockedUsers (
    @CurrentUser() user: CurrentUserDto,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<BlocksResponse> {
    return await this.blockService.getBlock(user.id, page, limit)
  }
}
