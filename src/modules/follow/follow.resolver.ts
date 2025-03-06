import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { FollowService } from './follow.service'
import { User } from '../users/entity/user.entity'
import { Role } from 'src/common/constant/enum.constant'
import { Auth } from 'src/common/decerator/auth.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { Follow } from './entity/follow.entity'
import { FollowResponse, FollowsResponse } from './dto/followResponse.dto'

@Resolver(() => Follow)
export class FollowResolver {
  constructor (private readonly followService: FollowService) {}

  @Mutation(() => FollowResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async followUser (
    @CurrentUser() user: User,
    @Args('followingId') followingId: number,
  ): Promise<FollowResponse> {
    return this.followService.follow(user.id, followingId)
  }

  @Mutation(() => FollowResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async unfollowingUser (
    @CurrentUser() user: User,
    @Args('followerId') followerId: number,
  ): Promise<FollowResponse> {
    return this.followService.unfollowing(user.id, followerId)
  }

  @Query(() => FollowResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getRelationStatus (
    @CurrentUser() user: User,
    @Args('followingId') followingId: number,
  ): Promise<FollowResponse> {
    return this.followService.get(user.id, followingId)
  }

  @Query(() => FollowsResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getFollowers (
    @Args('followerId') followerId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<FollowsResponse> {
    return await this.followService.getFollowers(followerId, page, limit)
  }

  @Query(() => FollowsResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getFollowings (
    @Args('followingId') followingId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<FollowsResponse> {
    return await this.followService.getFollowing(followingId, page, limit)
  }

  @Query(() => FollowsResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getFriends (
    @CurrentUser() user: CurrentUserDto,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<FollowsResponse> {
    return await this.followService.getFriends(user.id, page, limit)
  }

  @Mutation(() => FollowResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async acceptFollowRequest (
    @CurrentUser() user: CurrentUserDto,
    @Args('followingId') followingId: number,
    @Args('status') status: boolean,
  ): Promise<FollowResponse> {
    return this.followService.accept(user.id, followingId, status)
  }
}
