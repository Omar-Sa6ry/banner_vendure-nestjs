import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { CommentService } from './comment.service'
import { User } from '../users/entity/user.entity'
import { Auth } from 'src/common/decerator/auth.decerator'
import { Role } from 'src/common/constant/enum.constant'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { Post } from '../post/entity/post.entity '
import { Comment } from './entity/comment.entity '
import { CommentResponse, CommentsResponse } from './dto/CommentResponse.dto'

@Resolver(() => Comment)
export class CommentResolver {
  constructor (private readonly commentService: CommentService) {}

  @Mutation(() => CommentResponse)
  @Auth(Role.USER)
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
    return await this.commentService.getById(id)
  }

  @Query(() => CommentResponse)
  @Auth(Role.USER)
  async getComment (
    @CurrentUser() user: CurrentUserDto,
    @Args('postId', { type: () => Int }) postId: number,
    @Args('content', { type: () => String }) content: string,
  ): Promise<CommentResponse> {
    return await this.commentService.getByData(user.id, postId, content)
  }

  @Query(() => CommentsResponse)
  @Auth(Role.USER)
  async getCommentsForPost (
    @Args('postId', { type: () => Int }) postId: number,
    @Args('page', { type: () => Int, nullable: true }) page: number,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
  ): Promise<CommentsResponse> {
    return await this.commentService.getCommentPost(postId, page, limit)
  }

  @Query(() => Int)
  @Auth(Role.USER)
  async getCountCommentPost (
    @Args('postId', { type: () => Int }) postId: number,
  ): Promise<number> {
    return this.commentService.getCountCommentPost(postId)
  }

  @Query(() => CommentsResponse)
  @Auth(Role.USER)
  async getCommentsByUserOnPost (
    @CurrentUser() user: CurrentUserDto,
    @Args('postId', { type: () => Int }) postId: number,
  ): Promise<CommentsResponse> {
    return await this.commentService.getCommentUserOnPost(user.id, postId)
  }

  @Query(() => CommentsResponse)
  @Auth(Role.USER)
  async getCommentsByUser (
    @CurrentUser() user: CurrentUserDto,
  ): Promise<CommentsResponse> {
    return await this.commentService.getCommentUser(user.id)
  }

  @Query(() => User)
  @Auth(Role.USER)
  async getUserByComment (
    @Args('commentId', { type: () => Int }) commentId: number,
  ): Promise<User> {
    return this.commentService.getUserByComment(commentId)
  }

  @Query(() => Post)
  @Auth(Role.USER)
  async getPostByComment (
    @Args('commentId', { type: () => Int }) commentId: number,
  ): Promise<Post> {
    return this.commentService.getPostByComment(commentId)
  }

  @Mutation(() => CommentResponse)
  @Auth(Role.USER)
  async updateComment (
    @CurrentUser() user: CurrentUserDto,
    @Args('commentId', { type: () => Int }) commentId: number,
    @Args('content', { type: () => String }) content: string,
  ): Promise<CommentResponse> {
    return this.commentService.update(user.id, commentId, content)
  }

  @Mutation(() => CommentResponse)
  @Auth(Role.USER)
  async deleteComment (
    @CurrentUser() user: CurrentUserDto,
    @Args('commentId', { type: () => Int }) commentId: number,
  ): Promise<CommentResponse> {
    return this.commentService.delete(user.id, commentId)
  }
}
