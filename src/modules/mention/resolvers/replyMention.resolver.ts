import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { Role } from 'src/common/constant/enum.constant'
import { Auth } from 'src/common/decerator/auth.decerator'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { Mention } from '../entity/mention.entity '
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { ReplyMentionService } from '../services/replyMention.service'
import {
  ReplyMentionResponse,
  ReplyMentionsResponse,
} from '../dtos/replyMention.response'

@Resolver(() => Mention)
export class ReplyMentionResolver {
  constructor (private readonly mentionService: ReplyMentionService) {}

  @Mutation(() => ReplyMentionResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async createReplyMention (
    @CurrentUser() user: CurrentUserDto,
    @Args('mentionToId', { type: () => Int }) mentionToId: number,
    @Args('replyId', { type: () => Int }) replyId: number,
  ): Promise<ReplyMentionResponse> {
    return await this.mentionService.create(user.id, mentionToId, replyId)
  }

  @Query(() => ReplyMentionResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async findMentionForReply (
    @CurrentUser() user: CurrentUserDto,
    @Args('mentionToId', { type: () => Int }) mentionToId: number,
    @Args('replyId', { type: () => Int }) replyId: number,
  ): Promise<ReplyMentionResponse> {
    return await this.mentionService.findMentionForReply(
      user.id,
      mentionToId,
      replyId,
    )
  }

  @Query(() => ReplyMentionsResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getMentionsReceivedReply (
    @CurrentUser() user: CurrentUserDto,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<ReplyMentionsResponse> {
    return await this.mentionService.getMentionsReceived(user.id, page, limit)
  }

  @Query(() => ReplyMentionsResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getMentionsSentReply (
    @Args('mentionToId', { type: () => Int }) mentionToId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<ReplyMentionsResponse> {
    return await this.mentionService.getMentionsSent(mentionToId, page, limit)
  }

  @Query(() => ReplyMentionsResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getMentionsForReply (
    @Args('replyId', { type: () => Int }) replyId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<ReplyMentionsResponse> {
    return await this.mentionService.getMentionsForReply(replyId, page, limit)
  }

  @Mutation(() => ReplyMentionResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async deleteReplyMention (
    @CurrentUser() user: CurrentUserDto,
    @Args('mentionToId', { type: () => Int }) mentionToId: number,
    @Args('replyId', { type: () => Int }) replyId: number,
  ): Promise<ReplyMentionResponse> {
    return this.mentionService.deleteMentionFromReply(
      user.id,
      mentionToId,
      replyId,
    )
  }
}
