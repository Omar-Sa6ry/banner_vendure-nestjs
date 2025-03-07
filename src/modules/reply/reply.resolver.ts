import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { ReplyService } from './reply.service'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { Role } from 'src/common/constant/enum.constant'
import { Auth } from 'src/common/decerator/auth.decerator'
import { Reply } from './entity/reply.entity'
import { UserResponse } from '../users/dtos/UserResponse.dto'
import { ReplyResponse, ReplysResponse } from './dto/ReplyResponse.dto'
import { ReplyInputResponse, ReplysInputResponse } from './input/reply.input'
import { RedisService } from 'src/common/redis/redis.service'

@Resolver(() => Reply)
export class ReplyResolver {
  constructor (
    private readonly redisService: RedisService,
    private readonly replyService: ReplyService,
  ) {}

  @Mutation(() => ReplyResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async writeReply (
    @CurrentUser() user: CurrentUserDto,
    @Args('commentId') commentId: number,
    @Args('content') content: string,
  ): Promise<ReplyResponse> {
    return await this.replyService.write(user.id, commentId, content)
  }

  @Query(() => ReplyResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getReply (
    @CurrentUser() user: CurrentUserDto,
    @Args('commentId') commentId: number,
    @Args('content') content: string,
  ): Promise<ReplyResponse> {
    const replyCacheKey = `reply-comment:${commentId}`
    const cachedreply = await this.redisService.get(replyCacheKey)
    if (cachedreply instanceof ReplyInputResponse) {
      return { ...cachedreply }
    }

    return await this.replyService.get(user.id, commentId, content)
  }

  @Query(() => ReplysResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getRepliesByComment (
    @Args('commentId') commentId: number,
  ): Promise<ReplysResponse> {
    const replyCacheKey = `reply-comment:${commentId}`
    const cachedreply = await this.redisService.get(replyCacheKey)
    if (cachedreply instanceof ReplysInputResponse) {
      return { ...cachedreply }
    }

    return await this.replyService.getCommentPost(commentId)
  }

  @Query(() => ReplyResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getRepliesCount (@Args('commentId') commentId: number): Promise<ReplyResponse> {
    return await this.replyService.getCountCommentPost(commentId)
  }

  @Query(() => ReplysResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getRepliesByUser (
    @CurrentUser() user: CurrentUserDto,
    @Args('page', { type: () => Int, nullable: true }) page: number,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
  ): Promise<ReplysResponse> {
    return await this.replyService.getCommentUser(user.id, page, limit)
  }

  @Query(() => ReplysResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getLastReplies (
    @CurrentUser() user: CurrentUserDto,
    @Args('commentId') commentId: number,
    @Args('page', { type: () => Int, nullable: true }) page: number,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
  ): Promise<ReplysResponse> {
    const replyCacheKey = `reply-comment:${commentId}`
    const cachedreply = await this.redisService.get(replyCacheKey)
    if (cachedreply instanceof ReplysInputResponse) {
      return { ...cachedreply }
    }

    return await this.replyService.getLastComment(
      user.id,
      commentId,
      page,
      limit,
    )
  }

  @Query(() => UserResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getUserByReply (@Args('id') id: number): Promise<UserResponse> {
    return await this.replyService.getUserByComment(id)
  }

  @Mutation(() => ReplyResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async updateReply (
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: number,
    @Args('content') content: string,
  ): Promise<ReplyResponse> {
    return await this.replyService.update(user.id, id, content)
  }

  @Mutation(() => ReplyResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async deleteReply (
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: number,
  ): Promise<ReplyResponse> {
    return await this.replyService.delete(user.id, id)
  }
}
