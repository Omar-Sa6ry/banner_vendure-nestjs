import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { PostService } from './post.service'
import { Post } from './entity/post.entity '
import { Auth } from 'src/common/decerator/auth.decerator'
import { Role } from 'src/common/constant/enum.constant'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { RedisService } from 'src/common/redis/redis.service'
import { PostResponse, PostsResponse } from './dto/PostResponse.dto'
import { PostInputResponse } from './input/Post.input'

@Resolver(() => Post)
export class PostResolver {
  constructor (
    private readonly redisService: RedisService,
    private readonly postService: PostService,
  ) {}

  @Mutation(() => PostResponse)
  @Auth(Role.USER)
  async createPost (
    @CurrentUser() user: CurrentUserDto,
    @Args('content', { type: () => String }) content: string,
    @Args('bannerId', { type: () => Int }) bannerId: number,
  ): Promise<PostResponse> {
    return await this.postService.create(user.id, bannerId, content)
  }

  @Query(() => PostResponse)
  async getPostById (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<PostResponse> {
    const postCacheKey = `post:${id}`
    const cachedPost = await this.redisService.get(postCacheKey)
    if (cachedPost instanceof PostInputResponse) {
      return { ...cachedPost }
    }

    return await this.postService.getId(id)
  }

  @Query(() => PostsResponse)
  async searchPosts (
    @Args('content', { type: () => String, nullable: true }) content: string,
    @Args('page', { type: () => Int, nullable: true }) page: number,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
  ): Promise<PostsResponse> {
    return await this.postService.getContent(content, page, limit)
  }

  @Query(() => PostsResponse)
  @Auth(Role.USER)
  async getUserPosts (
    @CurrentUser() user: CurrentUserDto,
  ): Promise<PostsResponse> {
    return await this.postService.userPosts(user.id)
  }

  @Mutation(() => PostResponse)
  @Auth(Role.USER)
  async updatePost (
    @CurrentUser() user: CurrentUserDto,
    @Args('id', { type: () => Int }) id: number,
    @Args('content', { type: () => String }) content: string,
  ): Promise<PostResponse> {
    return await this.postService.update(user.id, id, content)
  }

  @Mutation(() => PostResponse)
  @Auth(Role.USER)
  async deletePost (
    @CurrentUser() user: CurrentUserDto,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<PostResponse> {
    return await this.postService.delete(user.id, id)
  }
}
