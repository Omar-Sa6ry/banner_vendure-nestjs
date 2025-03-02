import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { Post } from 'src/modules/post/entity/post.entity '
import { Comment } from '../entity/comment.entity '
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { CommentInput } from '../input/comment.input'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { Like } from 'src/modules/like/entity/like.entity '

@Injectable()
export class CommentLoader {
  private loader: DataLoader<number, CommentInput>

  constructor (
    @InjectModel(Comment) private commentRepo: typeof Comment,
    @InjectModel(Like) private likeRepo: typeof Like,
    @InjectModel(Post) private postRepo: typeof Post,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, CommentInput>(
      async (keys: number[]) => {
        const comments = await this.commentRepo.findAll({
          where: { id: { [Op.in]: keys } },
        })
        const commentMap = new Map(
          comments.map(comment => [comment.id, comment]),
        )

        const userIds = [...new Set(comments.map(comment => comment.userId))]
        const users = await this.userRepo.findAll({
          where: { id: { [Op.in]: userIds } },
        })
        const userMap = new Map(users.map(user => [user.id, user]))

        // Post and his details
        const postIds = [...new Set(comments.map(comment => comment.postId))]
        const posts = await this.postRepo.findAll({
          where: { id: { [Op.in]: postIds } },
        })
        const posttMap = new Map(posts.map(post => [post.id, post]))

        const userPostIds = [...new Set(posts.map(post => post.userId))]
        const userPosts = await this.userRepo.findAll({
          where: { id: { [Op.in]: userPostIds } },
        })
        const userPostMap = new Map(userPosts.map(user => [user.id, user]))

        const commentPosts = await this.commentRepo.findAll({
          where: { id: { [Op.in]: postIds } },
        })
        const commentPostMap = new Map<number, Comment[]>()
        commentPosts.forEach(comment => {
          if (!commentPostMap.has(comment.postId)) {
            commentPostMap.set(comment.postId, [])
          }
          commentPostMap.get(comment.postId)?.push(comment)
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
          const comment = commentMap.get(id)
          if (!comment)
            throw new NotFoundException(this.i18n.t('comment.NOT_FOUND'))

          const user = userMap.get(comment.userId)
          const post = posttMap.get(comment.postId)
          const userPost = userPostMap.get(post.userId)
          const comments = commentPostMap.get(post.id)
          const likes = postlikeMap.get(post.id).length

          const result: CommentInput = {
            ...comment,
            user,
            post: { ...post, user: userPost, likes, comments },
          }
          return result
        })
      },
    )
  }

  load (id: number): Promise<CommentInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<CommentInput[]> {
    const results = await this.loader.loadMany(ids)
    return results.filter(
      (result): result is CommentInput => !(result instanceof Error),
    )
  }
}
