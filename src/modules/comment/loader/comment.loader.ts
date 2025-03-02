import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { Post } from 'src/modules/post/entity/post.entity '
import { Comment } from '../entity/comment.entity '
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { CommentInput } from '../input/comment.input'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'

@Injectable()
export class CommentLoader {
  private loader: DataLoader<number, CommentInput>

  constructor (
    @InjectModel(Comment) private commentRepo: typeof Comment,
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

        const postIds = [...new Set(comments.map(comment => comment.postId))]
        const posts = await this.postRepo.findAll({
          where: { id: { [Op.in]: postIds } },
        })
        const posttMap = new Map(posts.map(post => [post.id, post]))

        const userIds = [...new Set(comments.map(comment => comment.userId))]
        const users = await this.userRepo.findAll({
          where: { id: { [Op.in]: userIds } },
        })
        const userMap = new Map(users.map(user => [user.id, user]))

        return keys.map(id => {
          const comment = commentMap.get(id)
          if (!comment)
            throw new NotFoundException(this.i18n.t('comment.NOT_FOUND'))

          const post = posttMap.get(comment.postId)
          const user = userMap.get(comment.userId)

          return {
            ...comment,
            user,
            post,
          }
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
