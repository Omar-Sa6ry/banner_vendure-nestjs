import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { Post } from 'src/modules/post/entity/post.entity '
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { Like } from '../entity/like.entity '
import { CommentLikeInput } from '../inputs/commentLike.input'

@Injectable()
export class CommentLikeLoader {
  private loader: DataLoader<number, CommentLikeInput>

  constructor (
    @InjectModel(Comment) private commentRepo: typeof Comment,
    @InjectModel(Like) private likeRepo: typeof Like,
    @InjectModel(Post) private postRepo: typeof Post,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, CommentLikeInput>(
      async (keys: number[]) => {
        const likes = await this.likeRepo.findAll({
          where: { id: { [Op.in]: keys } },
        })
        const likeMap = new Map(likes.map(like => [like.id, like]))

        const userIds = [...new Set(likes.map(like => like.userId))]
        const users = await this.userRepo.findAll({
          where: { id: { [Op.in]: userIds } },
        })
        const userMap = new Map(users.map(user => [user.id, user]))

        const commentIds = [...new Set(likes.map(like => like.commentId))]
        const comments = await this.commentRepo.findAll({
          where: { id: { [Op.in]: commentIds } },
        })
        const commentMap = new Map(
          comments.map(comment => [comment.id, comment]),
        )

        const postIds = [...new Set(comments.map(comment => comment.postId))]
        const posts = await this.postRepo.findAll({
          where: { id: { [Op.in]: postIds } },
        })
        const posttMap = new Map(posts.map(post => [post.id, post]))

        const commentUserIds = [...new Set(comments.map(post => post.userId))]
        const commentUsers = await this.userRepo.findAll({
          where: { id: { [Op.in]: commentUserIds } },
        })
        const commentUserMap = new Map(
          commentUsers.map(user => [user.id, user]),
        )

        const postComments = await this.commentRepo.findAll({
          where: { id: { [Op.in]: postIds } },
        })
        const commentsMap = new Map<number, Comment[]>()
        postComments.forEach(comment => {
          if (!commentsMap.has(comment.postId)) {
            commentsMap.set(comment.postId, [])
          }
          commentsMap.get(comment.postId)?.push(comment)
        })

        const postLikes = await this.likeRepo.findAll({
          where: { postId: { [Op.in]: postIds } },
        })
        const postlikeMap = new Map<number, Like[]>()
        postLikes.forEach(like => {
          if (!postlikeMap.has(like.postId)) {
            postlikeMap.set(like.postId, [])
          }
          postlikeMap.get(like.postId)?.push(like)
        })

        return keys.map(id => {
          const like = likeMap.get(id).dataValues
          if (!like)
            throw new NotFoundException(this.i18n.t('likeComment.NOT_FOUND'))

          const user = userMap.get(like.userId).dataValues
          const comment = commentMap.get(like.commentId).dataValues
          const post = posttMap.get(comment.postId).dataValues
          const userComment = commentUserMap.get(post.userId).dataValues
          const likes = postlikeMap.get(post.id).length || 0
          const comments = commentsMap
            .get(post.id)
            .map(comment => comment.dataValues)

          return {
            ...like,
            user,
            comment: {
              ...comment,
              post: { ...post, comments, likes },
              comments,
              user: userComment,
            },
          }
        })
      },
    )
  }

  load (id: number): Promise<CommentLikeInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<CommentLikeInput[]> {
    const results = await this.loader.loadMany(ids)
    return results.filter(
      (result): result is CommentLikeInput => !(result instanceof Error),
    )
  }
}
