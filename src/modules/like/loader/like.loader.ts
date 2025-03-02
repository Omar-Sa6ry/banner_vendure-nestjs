import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { Post } from 'src/modules/post/entity/post.entity '
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { LikeInput } from '../input/like.input'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { Like } from '../entity/like.entity '

@Injectable()
export class LikeLoader {
  private loader: DataLoader<number, LikeInput>

  constructor (
    @InjectModel(Comment) private commentRepo: typeof Comment,
    @InjectModel(Like) private likeRepo: typeof Like,
    @InjectModel(Post) private postRepo: typeof Post,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, LikeInput>(async (keys: number[]) => {
      const likes = await this.likeRepo.findAll({
        where: { id: { [Op.in]: keys } },
      })
      const likeMap = new Map(likes.map(like => [like.id, like]))

      const userIds = [...new Set(likes.map(like => like.userId))]
      const users = await this.userRepo.findAll({
        where: { id: { [Op.in]: userIds } },
      })
      const userMap = new Map(users.map(user => [user.id, user]))

      // Post and his details
      const postIds = [...new Set(likes.map(like => like.postId))]
      const posts = await this.postRepo.findAll({
        where: { id: { [Op.in]: postIds } },
      })
      const posttMap = new Map(posts.map(post => [post.id, post]))

      const postUserIds = [...new Set(posts.map(post => post.userId))]
      const postUsers = await this.userRepo.findAll({
        where: { id: { [Op.in]: postUserIds } },
      })
      const postUserMap = new Map(postUsers.map(user => [user.id, user]))

      const comments = await this.commentRepo.findAll({
        where: { id: { [Op.in]: postIds } },
      })
      const commentMap = new Map<number, Comment[]>()
      comments.forEach(comment => {
        if (!commentMap.has(comment.postId)) {
          commentMap.set(comment.postId, [])
        }
        commentMap.get(comment.postId)?.push(comment)
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
        const like = likeMap.get(id)
        if (!like) throw new NotFoundException(this.i18n.t('like.NOT_FOUND'))

        const user = userMap.get(like.userId)
        const post = posttMap.get(like.postId)
        const userPost = postUserMap.get(post.userId)
        const comments = commentMap.get(like.postId)
        const likes = postlikeMap.get(like.postId).length

        return {
          ...like,
          user,
          post: { ...post, comments, user: userPost, likes },
        }
      })
    })
  }

  load (id: number): Promise<LikeInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<LikeInput[]> {
    const results = await this.loader.loadMany(ids)
    return results.filter(
      (result): result is LikeInput => !(result instanceof Error),
    )
  }
}
