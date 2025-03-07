import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { Role } from 'src/common/constant/enum.constant'
import { Auth } from 'src/common/decerator/auth.decerator'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { CommentLikesInputResponse } from '../inputs/commentLike.input'
import { CommentLikeService } from '../services/commentLike.service'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { Like } from '../entity/like.entity '
import { RedisService } from 'src/common/redis/redis.service'
import {
  CommentLikeResponse,
  CommentLikesResponse,
} from '../dtos/commentLike.response'

@Resolver(() => Like)
export class CommentLikeResolver {
  constructor (
    private readonly redisService: RedisService,
    private readonly likeService: CommentLikeService,
  ) {}

  @Mutation(() => CommentLikeResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async likeComment (
    @CurrentUser() user: CurrentUserDto,
    @Args('commentId', { type: () => Int }) commentId: number,
  ): Promise<CommentLikeResponse> {
    return this.likeService.likeCommnt(user.id, commentId)
  }

  @Mutation(() => CommentLikeResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async unlikeComment (
    @CurrentUser() user: CurrentUserDto,
    @Args('commentId', { type: () => Int }) commentId: number,
  ): Promise<CommentLikeResponse> {
    return this.likeService.uncommentLike(user.id, commentId)
  }

  @Query(() => CommentLikesResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async commnetLikedUser (
    @CurrentUser() user: CurrentUserDto,
    @Args('page', { type: () => Int, nullable: true }) page: number,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
  ): Promise<CommentLikesResponse> {
    const likeCacheKey = `like-user:${user.id}`
    const cachedLike = await this.redisService.get(likeCacheKey)
    if (cachedLike instanceof CommentLikesInputResponse) {
      return { ...cachedLike }
    }

    return this.likeService.usercommentLikes(user.id, page, limit)
  }

  @Query(() => CommentLikeResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async commentLikeCount (
    @Args('commentId', { type: () => Int }) commentId: number,
  ): Promise<CommentLikeResponse> {
    return this.likeService.numcommentLikes(commentId)
  }
}
