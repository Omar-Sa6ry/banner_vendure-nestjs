import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { Role } from 'src/common/constant/enum.constant'
import { Auth } from 'src/common/decerator/auth.decerator'
import { Hashtag } from '../entity/hastage.entity'
import { ReplyHashtagService } from '../services/replyHashtage.service'
import {
  ReplyHastageResponse,
  ReplyHastagesResponse,
} from '../dtos/HashtagReply.dto   '

@Resolver(() => Hashtag)
export class ReplyHashtagResolver {
  constructor (private readonly hashtagService: ReplyHashtagService) {}

  @Mutation(() => ReplyHastageResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async createHashtagReply (
    @CurrentUser() user: CurrentUserDto,
    @Args('replyId', { type: () => Int }) replyId: number,
    @Args('content') content: string,
  ): Promise<ReplyHastageResponse> {
    return await this.hashtagService.createHastageReply(
      user.id,
      replyId,
      content,
    )
  }

  @Query(() => ReplyHastageResponse, { nullable: true })
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async findReplyHashtag (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<ReplyHastageResponse> {
    return await this.hashtagService.findReplyHashtag(id)
  }

  @Query(() => ReplyHastagesResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async findAllReplyHashtags (
    @Args('replyId', { type: () => Int }) replyId: number,
    @Args('page', { type: () => Int, nullable: true }) page: number,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
  ): Promise<ReplyHastagesResponse> {
    return await this.hashtagService.findAllReplyHashtag(replyId, page, limit)
  }

  @Query(() => ReplyHastagesResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async findAllUserHashtagOnReply (
    @CurrentUser() user: CurrentUserDto,
    @Args('page', { type: () => Int, nullable: true }) page: number,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
  ): Promise<ReplyHastagesResponse> {
    return await this.hashtagService.findAllUserHashtagOnPost(
      user.id,
      page,
      limit,
    )
  }

  @Mutation(() => ReplyHastageResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async updateHashtagReply (
    @CurrentUser() user: CurrentUserDto,
    @Args('id', { type: () => Int }) id: number,
    @Args('replyId', { type: () => Int }) replyId: number,
    @Args('content') content: string,
  ): Promise<ReplyHastageResponse> {
    return await this.hashtagService.updateHastageReply(
      user.id,
      id,
      replyId,
      content,
    )
  }

  @Mutation(() => ReplyHastageResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async deleteHashtag (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<ReplyHastageResponse> {
    return this.hashtagService.deleteHastage(id)
  }
}
