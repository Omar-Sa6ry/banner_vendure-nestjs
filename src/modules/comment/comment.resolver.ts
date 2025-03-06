import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { CommentService } from './comment.service'
import { Auth } from 'src/common/decerator/auth.decerator'
import { Role } from 'src/common/constant/enum.constant'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { Comment } from './entity/comment.entity '
import { CommentResponse, CommentsResponse } from './dto/CommentResponse.dto'
import { RedisService } from 'src/common/redis/redis.service'
import { CommentInputResponse } from './input/comment.input'
import { UserResponse } from '../users/dtos/UserResponse.dto'
import { PostResponse } from '../post/dto/PostResponse.dto'

@Resolver(() => Comment)
export class CommentResolver {
  constructor (
    private readonly redisService: RedisService,
    private readonly commentService: CommentService,
  ) {}

  @Mutation(() => CommentResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async writeComment (
    @CurrentUser() user: CurrentUserDto,
    @Args('postId', { type: () => Int }) postId: number,
    @Args('content', { type: () => String }) content: string,
  ): Promise<CommentResponse> {
    return await this.commentService.write(user.id, postId, content)
  }

  @Query(() => CommentResponse)
  async getCommentById (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<CommentResponse> {
    const commentCacheKey = `comment:${id}`
    const cachedComment = await this.redisService.get(commentCacheKey)
    if (cachedComment instanceof CommentInputResponse) {
      return { ...cachedComment }
    }

    return await this.commentService.getById(id)
  }

  @Query(() => CommentResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getComment (
    @CurrentUser() user: CurrentUserDto,
    @Args('postId', { type: () => Int }) postId: number,
    @Args('content', { type: () => String }) content: string,
  ): Promise<CommentResponse> {
    return await this.commentService.getByData(user.id, postId, content)
  }

  @Query(() => CommentsResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getCommentsForPost (
    @Args('postId', { type: () => Int }) postId: number,
    @Args('page', { type: () => Int, nullable: true }) page: number,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
  ): Promise<CommentsResponse> {
    return await this.commentService.getCommentPost(postId, page, limit)
  }

  @Query(() => Int)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getCountCommentPost (
    @Args('postId', { type: () => Int }) postId: number,
  ): Promise<number> {
    return this.commentService.getCountCommentPost(postId)
  }

  @Query(() => CommentsResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getCommentsByUserOnPost (
    @CurrentUser() user: CurrentUserDto,
    @Args('postId', { type: () => Int }) postId: number,
  ): Promise<CommentsResponse> {
    return await this.commentService.getCommentUserOnPost(user.id, postId)
  }

  @Query(() => CommentsResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getCommentsByUser (
    @CurrentUser() user: CurrentUserDto,
  ): Promise<CommentsResponse> {
    return await this.commentService.getCommentUser(user.id)
  }

  @Query(() => UserResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getUserByComment (
    @Args('commentId', { type: () => Int }) commentId: number,
  ): Promise<UserResponse> {
    return this.commentService.getUserByComment(commentId)
  }

  @Query(() => PostResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async getPostByComment (
    @Args('commentId', { type: () => Int }) commentId: number,
  ): Promise<PostResponse> {
    return this.commentService.getPostByComment(commentId)
  }

  @Mutation(() => CommentResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async updateComment (
    @CurrentUser() user: CurrentUserDto,
    @Args('commentId', { type: () => Int }) commentId: number,
    @Args('content', { type: () => String }) content: string,
  ): Promise<CommentResponse> {
    return this.commentService.update(user.id, commentId, content)
  }

  @Mutation(() => CommentResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async deleteComment (
    @CurrentUser() user: CurrentUserDto,
    @Args('commentId', { type: () => Int }) commentId: number,
  ): Promise<CommentResponse> {
    return this.commentService.delete(user.id, commentId)
  }
}
