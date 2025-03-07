import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { Role } from 'src/common/constant/enum.constant'
import { ReplyLikesInputResponse } from '../inputs/replyLike.input'
import { Auth } from 'src/common/decerator/auth.decerator'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { Like } from '../entity/like.entity '
import { RedisService } from 'src/common/redis/redis.service'
import { ReplyLikeService } from '../services/replyLike.service'
import {
  ReplyLikeResponse,
  ReplyLikesResponse,
} from '../dtos/replyLike.response'

@Resolver(() => Like)
export class ReplyLikeResolver {
  constructor (
    private readonly redisService: RedisService,
    private readonly likeService: ReplyLikeService,
  ) {}

  @Mutation(() => ReplyLikeResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async likeReply (
    @CurrentUser() user: CurrentUserDto,
    @Args('replyId', { type: () => Int }) replyId: number,
  ): Promise<ReplyLikeResponse> {
    return this.likeService.likeReply(user.id, replyId)
  }

  @Mutation(() => ReplyLikeResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async unlikeReply (
    @CurrentUser() user: CurrentUserDto,
    @Args('replyId', { type: () => Int }) replyId: number,
  ): Promise<ReplyLikeResponse> {
    return this.likeService.unReplyLike(user.id, replyId)
  }

  @Query(() => ReplyLikesResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async commnetLikedUser (
    @CurrentUser() user: CurrentUserDto,
    @Args('page', { type: () => Int, nullable: true }) page: number,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
  ): Promise<ReplyLikesResponse> {
    const likeCacheKey = `like-user:${user.id}`
    const cachedLike = await this.redisService.get(likeCacheKey)
    if (cachedLike instanceof ReplyLikesInputResponse) {
      return { ...cachedLike }
    }

    return this.likeService.userReplyLikes(user.id, page, limit)
  }

  @Query(() => ReplyLikeResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async commentLikeCount (
    @Args('replyId', { type: () => Int }) replyId: number,
  ): Promise<ReplyLikeResponse> {
    return this.likeService.numReplyLikes(replyId)
  }
}
