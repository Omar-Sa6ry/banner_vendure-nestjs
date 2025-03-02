import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { Post } from 'src/modules/post/entity/post.entity '
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { PostInput } from '../input/Post.input'
import { Comment } from 'src/modules/comment/entity/comment.entity '

@Injectable()
export class postLoader {
  private loader: DataLoader<number, PostInput>

  constructor (
    @InjectModel(Comment) private commentRepo: typeof Comment,
    @InjectModel(Post) private postRepo: typeof Post,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, PostInput>(async (keys: number[]) => {
      const posts = await this.postRepo.findAll({
        where: { id: { [Op.in]: keys } },
      })

      const postIds = [...new Set(posts.map(post => post.id))]
      const comments = await this.commentRepo.findAll({
        where: { postId: { [Op.in]: postIds } },
      })

      const userIds = [...new Set(posts.map(post => post.userId))]
      const users = await this.userRepo.findAll({
        where: { id: { [Op.in]: userIds } },
      })

      const postMap = new Map(posts.map(post => [post.id, post]))
      const userMap = new Map(users.map(user => [user.id, user]))
      const commentMap = new Map<number, Comment[]>()
      comments.forEach(comment => {
        if (!commentMap.has(comment.postId)) {
          commentMap.set(comment.postId, [])
        }
        commentMap.get(comment.postId)?.push(comment)
      })

      return keys.map(id => {
        const post = postMap.get(id)
        if (!post) throw new NotFoundException(this.i18n.t('post.NOT_FOUND'))

        const comments = commentMap.get(id)
        const user = userMap.get(post.userId)

        return {
          ...post,
          user,
          comments,
        }
      })
    })
  }

  load (id: number): Promise<PostInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<PostInput[]> {
    const results = await this.loader.loadMany(ids)
    return results.filter(
      (result): result is PostInput => !(result instanceof Error),
    )
  }
}
