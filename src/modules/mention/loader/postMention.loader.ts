import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { PostMentionInput } from '../inputs/postMention.input'
import { Mention } from '../entity/mention.entity '
import { Post } from 'src/modules/post/entity/post.entity '
import { PostInput } from 'src/modules/post/input/Post.input'
import { Banner } from 'src/modules/banner/entity/bannner.entity'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { Like } from 'src/modules/like/entity/like.entity '

@Injectable()
export class PostMentionLoader {
  private loader: DataLoader<number, PostMentionInput>

  constructor (
    @InjectModel(Mention) private mentionRepo: typeof Mention,
    @InjectModel(Banner) private bannerRepo: typeof Banner,
    @InjectModel(Like) private likeRepo: typeof Like,
    @InjectModel(Post) private postRepo: typeof Post,
    @InjectModel(Comment) private commentRepo: typeof Comment,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, PostMentionInput>(
      async (keys: number[]) => {
        const mentions = await this.mentionRepo.findAll({
          where: { id: { [Op.in]: keys } },
        })

        const postIds = [...new Set(mentions.map(mention => mention.postId))]
        const posts = await this.postRepo.findAll({
          where: { id: { [Op.in]: postIds } },
        })
        const postMap = new Map(posts.map(post => [post.id, post]))

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

        const comments = await this.commentRepo.findAll({
          where: { postId: { [Op.in]: keys } },
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

        const userIds = [...new Set(posts.map(post => post.userId))]
        const users = await this.userRepo.findAll({
          where: { id: { [Op.in]: userIds } },
        })

        const bannerIds = [...new Set(posts.map(post => post.bannerId))]
        const banners = await this.bannerRepo.findAll({
          where: { id: { [Op.in]: bannerIds } },
        })

        const bannerMap = new Map(banners.map(banner => [banner.id, banner]))
        const userMap = new Map(users.map(user => [user.id, user]))
        const commentMap = new Map<number, Comment[]>()
        comments.forEach(comment => {
          if (!commentMap.has(comment.postId)) {
            commentMap.set(comment.postId, [])
          }
          commentMap.get(comment.postId)?.push(comment)
        })

        return keys.map(id => {
          const mention = mentions.find(c => c.id === id)
          if (!mention)
            throw new NotFoundException(this.i18n.t('postMention.NOT_FOUND'))

          const post = postMap.get(mention.postId).dataValues
          if (!post) throw new NotFoundException(this.i18n.t('post.NOT_FOUND'))

          const mentionTo = mentionUserMap.get(mention.mentionToId).dataValues
          if (!mentionTo)
            throw new NotFoundException(this.i18n.t('postMention.NOT_FOUND_TO'))

          const mentionFrom = mentionUserMap.get(
            mention.mentionFromId,
          ).dataValues
          if (!mentionFrom)
            throw new NotFoundException(
              this.i18n.t('postMention.NOT_FOUND_FROM'),
            )

          const comments = commentMap.get(id)
          const banner = bannerMap.get(post.bannerId).dataValues
          const user = userMap.get(post.userId).dataValues
          const likes = likeMap.get(id) || []

          const postDetails: PostInput = {
            ...post,
            user,
            banner,
            comments,
            likes: likes.length || 0,
          }
          return {
            ...mention?.dataValues,
            post: postDetails,
            mentionTo,
            mentionFrom,
          }
        })
      },
    )
  }

  load (id: number): Promise<PostMentionInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<PostMentionInput[]> {
    const results = await this.loader.loadMany(ids)

    return results.filter(
      result => !(result instanceof Error),
    ) as PostMentionInput[]
  }
}
