import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { Hashtag } from '../entity/hastage.entity'
import { PostHashtagService } from '../services/postHashtage.service'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { Role } from 'src/common/constant/enum.constant'
import { Auth } from 'src/common/decerator/auth.decerator'
import {
  PostHastageResponse,
  PostHastagesResponse,
} from '../dtos/HashtagPostOutput.dto '

@Resolver(() => Hashtag)
export class PostHashtagResolver {
  constructor (private readonly hashtagService: PostHashtagService) {}

  @Mutation(() => PostHastageResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async createHashtagPost (
    @CurrentUser() user: CurrentUserDto,
    @Args('postId') postId: number,
    @Args('content') content: string,
  ): Promise<PostHastageResponse> {
    return await this.hashtagService.createHastagePost(user.id, postId, content)
  }

  @Query(() => PostHastageResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async findPostByHashtag (
    @Args('content') content: string,
  ): Promise<PostHastageResponse> {
    return await this.hashtagService.findPostHashtag(content)
  }

  @Query(() => PostHastagesResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async findAllPostHashtags (
    @Args('postId') postId: number,
    @Args('page', { type: () => Int, nullable: true }) page: number,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
  ): Promise<PostHastagesResponse> {
    return await this.hashtagService.findAllPostHashtag(postId, page, limit)
  }

  @Mutation(() => PostHastageResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async updateHashtagPost (
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: number,
    @Args('postId') postId: number,
    @Args('content') content: string,
  ): Promise<PostHastageResponse> {
    return await this.hashtagService.updateHastagePost(
      user.id,
      id,
      postId,
      content,
    )
  }

  @Query(() => PostHastagesResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async findAllUserHashtagOnPost (
    @CurrentUser() user: CurrentUserDto,
    @Args('page', { type: () => Int, nullable: true }) page: number,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
  ): Promise<PostHastagesResponse> {
    return await this.hashtagService.findAllUserHashtagOnPost(
      user.id,
      page,
      limit,
    )
  }
}
