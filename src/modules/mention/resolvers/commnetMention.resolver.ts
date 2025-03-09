import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { Role } from 'src/common/constant/enum.constant'
import { Auth } from 'src/common/decerator/auth.decerator'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { Mention } from '../entity/mention.entity '
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { CommentMentionService } from '../services/commentMention.service'
import {
  CommentMentionResponse,
  CommentMentionsResponse,
} from '../dtos/commentMention.response'

@Resolver(() => Mention)
export class CommentMentionResolver {
  constructor (private readonly mentionService: CommentMentionService) {}

  @Mutation(() => CommentMentionResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async createCommentMention (
    @CurrentUser() user: CurrentUserDto,
    @Args('mentionToId', { type: () => Int }) mentionToId: number,
    @Args('commentId', { type: () => Int }) commentId: number,
  ): Promise<CommentMentionResponse> {
    return await this.mentionService.create(user.id, mentionToId, commentId)
  }

  @Query(() => CommentMentionResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async findMentionForComment (
    @CurrentUser() user: CurrentUserDto,
    @Args('mentionToId', { type: () => Int }) mentionToId: number,
    @Args('commentId', { type: () => Int }) commentId: number,
  ): Promise<CommentMentionResponse> {
    return await this.mentionService.findMentionForComment(
      user.id,
      mentionToId,
      commentId,
    )
  }

  @Query(() => CommentMentionsResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getMentionsReceivedComment (
    @CurrentUser() user: CurrentUserDto,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<CommentMentionsResponse> {
    return await this.mentionService.getMentionsReceived(user.id, page, limit)
  }

  @Query(() => CommentMentionsResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getMentionsSentComment (
    @Args('mentionToId', { type: () => Int }) mentionToId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<CommentMentionsResponse> {
    return await this.mentionService.getMentionsSent(mentionToId, page, limit)
  }

  @Query(() => CommentMentionsResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getMentionsForComment (
    @Args('commentId', { type: () => Int }) commentId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<CommentMentionsResponse> {
    return await this.mentionService.getMentionsForComment(
      commentId,
      page,
      limit,
    )
  }

  @Mutation(() => CommentMentionResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async deleteCommentMention (
    @CurrentUser() user: CurrentUserDto,
    @Args('mentionToId', { type: () => Int }) mentionToId: number,
    @Args('commentId', { type: () => Int }) commentId: number,
  ): Promise<CommentMentionResponse> {
    return this.mentionService.deleteMentionFromComment(
      user.id,
      mentionToId,
      commentId,
    )
  }
}
