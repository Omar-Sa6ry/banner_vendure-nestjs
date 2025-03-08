import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { Hashtag } from '../entity/hastage.entity'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { Role } from 'src/common/constant/enum.constant'
import { Auth } from 'src/common/decerator/auth.decerator'
import { CommnetHashtagService } from '../services/commnetHastage.service'
import {
  CommentHastageResponse,
  CommentHastagesResponse,
} from '../dtos/HashtagCommentOutput.dto  '

@Resolver(() => Hashtag)
export class CommnetHashtagResolver {
  constructor (private readonly hashtagService: CommnetHashtagService) {}

  @Mutation(() => CommentHastageResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async createHashtagComment (
    @CurrentUser() user: CurrentUserDto,
    @Args('commentId') commentId: number,
    @Args('content') content: string,
  ): Promise<CommentHastageResponse> {
    return await this.hashtagService.createHashtagComment(
      user.id,
      commentId,
      content,
    )
  }

  @Query(() => CommentHastageResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async findCommentByHashtag (
    @Args('content') content: string,
  ): Promise<CommentHastageResponse> {
    return await this.hashtagService.findCommentHashtag(content)
  }

  @Query(() => CommentHastagesResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async findAllCommentHashtags (
    @Args('commentId') commentId: number,
    @Args('page', { type: () => Int, nullable: true }) page: number,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
  ): Promise<CommentHastagesResponse> {
    return await this.hashtagService.findAllCommnetHashtag(
      commentId,
      page,
      limit,
    )
  }

  @Query(() => CommentHastagesResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async findAllUserHashtagsOnComments (
    @CurrentUser() user: CurrentUserDto,
    @Args('page', { type: () => Int, nullable: true }) page: number,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
  ): Promise<CommentHastagesResponse> {
    return await this.hashtagService.findAllUserHashtagOnPost(
      user.id,
      page,
      limit,
    )
  }

  @Mutation(() => CommentHastageResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async updateHashtagComment (
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: number,
    @Args('commentId') commentId: number,
    @Args('content') content: string,
  ): Promise<CommentHastageResponse> {
    return await this.hashtagService.updateHastageCommnet(
      user.id,
      id,
      commentId,
      content,
    )
  }
}
