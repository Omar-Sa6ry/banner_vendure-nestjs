import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { Mention } from '../entity/mention.entity '
import { Post } from 'src/modules/post/entity/post.entity '
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { Like } from 'src/modules/like/entity/like.entity '
import { CommentMentionInput } from '../inputs/commentMention.input'
import { CommentInput } from 'src/modules/comment/input/comment.input'

@Injectable()
export class CommentMentionLoader {
  private loader: DataLoader<number, CommentMentionInput>

  constructor (
    @InjectModel(Mention) private mentionRepo: typeof Mention,
    @InjectModel(Like) private likeRepo: typeof Like,
    @InjectModel(Post) private postRepo: typeof Post,
    @InjectModel(Comment) private commentRepo: typeof Comment,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, CommentMentionInput>(
      async (keys: number[]) => {
        const mentions = await this.mentionRepo.findAll({
          where: { id: { [Op.in]: keys } },
        })

        const commentIds = [
          ...new Set(mentions.map(mention => mention.commentId)),
        ]
        const comments = await this.commentRepo.findAll({
          where: { id: { [Op.in]: commentIds } },
        })
        const commentMap = new Map(
          comments.map(comment => [comment.id, comment]),
        )

        const mentionUserIds = [
          ...new Set(mentions.map(mention => mention.mentionFromId)),
          ...new Set(mentions.map(mention => mention.mentionToId)),
        ]
        const mentionUsers = await this.userRepo.findAll({
          where: { id: { [Op.in]: mentionUserIds } },
        })
        const mentionUserMap = new Map(
          mentionUsers.map(user => [user.id, user]),
        )

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

        const likes = await this.likeRepo.findAll({
          where: { postId: { [Op.in]: keys } },
        })
        const likeMap = new Map<number, Like[]>()
        likes.forEach(like => {
          if (!likeMap.has(like.postId)) {
            likeMap.set(like.postId, [])
          }
          likeMap.get(like.postId)?.push(like)
        })

        const userIds = [...new Set(comments.map(comment => comment.userId))]
        const users = await this.userRepo.findAll({
          where: { id: { [Op.in]: userIds } },
        })
        const userMap = new Map(users.map(user => [user.id, user]))

        return keys.map(id => {
          const mention = mentions.find(c => c.id === id)
          if (!mention)
            throw new NotFoundException(this.i18n.t('commentMention.NOT_FOUND'))

          const comment = commentMap.get(mention.commentId).dataValues
          if (!comment)
            throw new NotFoundException(this.i18n.t('comment.NOT_FOUND'))

          const mentionTo = mentionUserMap.get(mention.mentionToId).dataValues
          if (!mentionTo)
            throw new NotFoundException(
              this.i18n.t('commentMention.NOT_FOUND_TO'),
            )

          const mentionFrom = mentionUserMap.get(
            mention.mentionFromId,
          ).dataValues
          if (!mentionFrom)
            throw new NotFoundException(
              this.i18n.t('commentMention.NOT_FOUND_FROM'),
            )

          const user = userMap.get(comment.userId).dataValues
          const post = posttMap.get(comment.postId).dataValues
          const userPost = userPostMap.get(post.userId).dataValues
          const comments = commentPostMap
            .get(post.id)
            .map(comment => comment.dataValues)
          const likes = likeMap.get(post.id)?.length || 0

          const commentDetails: CommentInput = {
            ...comment,
            user,
            post: { ...post, user: userPost, likes, comments },
          }

          return {
            ...mention.dataValues,
            comment: commentDetails,
            mentionTo,
            mentionFrom,
          }
        })
      },
    )
  }

  load (id: number): Promise<CommentMentionInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<CommentMentionInput[]> {
    const results = await this.loader.loadMany(ids)

    return results.filter(
      result => !(result instanceof Error),
    ) as CommentMentionInput[]
  }
}
