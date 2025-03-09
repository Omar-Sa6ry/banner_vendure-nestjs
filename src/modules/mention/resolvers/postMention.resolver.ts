import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { Role } from 'src/common/constant/enum.constant'
import { Auth } from 'src/common/decerator/auth.decerator'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { Mention } from '../entity/mention.entity '
import { PostMentionService } from '../services/postMention.service'
import {
  PostMentionResponse,
  PostMentionsResponse,
} from '../dtos/postMention.response'

@Resolver(() => Mention)
export class PostMentionResolver {
  constructor (private readonly mentionService: PostMentionService) {}

  @Mutation(() => PostMentionResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async createPostMention (
    @CurrentUser() user: CurrentUserDto,
    @Args('mentionToId', { type: () => Int }) mentionToId: number,
    @Args('postId', { type: () => Int }) postId: number,
  ): Promise<PostMentionResponse> {
    return await this.mentionService.create(user.id, mentionToId, postId)
  }

  @Query(() => PostMentionsResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getMentionsForPost (
    @Args('postId', { type: () => Int }) postId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<PostMentionsResponse> {
    return await this.mentionService.getMentionsForPost(postId, page, limit)
  }

  @Query(() => PostMentionsResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getMentionsReceivedPost (
    @CurrentUser() user: CurrentUserDto,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<PostMentionsResponse> {
    return await this.mentionService.getMentionsReceived(user.id, page, limit)
  }

  @Query(() => PostMentionsResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getMentionsSentPost (
    @Args('mentionToId', { type: () => Int }) mentionToId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<PostMentionsResponse> {
    return await this.mentionService.getMentionsSent(mentionToId, page, limit)
  }

  @Query(() => PostMentionResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async mentionsForPost (
    @CurrentUser() user: CurrentUserDto,
    @Args('postId', { type: () => Int }) postId: number,
    @Args('mentionToId', { type: () => Int }) mentionToId: number,
  ): Promise<PostMentionResponse> {
    return await this.mentionService.findMentionForPost(
      user.id,
      mentionToId,
      postId,
    )
  }

  @Mutation(() => PostMentionResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async deletePostMention (
    @CurrentUser() user: CurrentUserDto,
    @Args('mentionToId', { type: () => Int }) mentionToId: number,
    @Args('postId', { type: () => Int }) postId: number,
  ): Promise<PostMentionResponse> {
    return this.mentionService.deleteMentionFromPost(
      user.id,
      mentionToId,
      postId,
    )
  }
}
