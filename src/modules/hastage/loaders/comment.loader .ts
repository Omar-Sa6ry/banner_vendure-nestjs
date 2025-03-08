import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { Post } from 'src/modules/post/entity/post.entity '
import { User } from 'src/modules/users/entity/user.entity'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { I18nService } from 'nestjs-i18n'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { Like } from 'src/modules/like/entity/like.entity '
import { CommnetHastageInput } from '../inputs/HashtagCommnet.input.dto'
import { Hashtag } from '../entity/hastage.entity'

@Injectable()
export class CommnetHashtagLoader {
  private loader: DataLoader<number, CommnetHastageInput>

  constructor (
    @InjectModel(Comment) private commentRepo: typeof Comment,
    @InjectModel(Hashtag) private HashtagRepo: typeof Hashtag,
    @InjectModel(Post) private postRepo: typeof Post,
    @InjectModel(Comment) private commnetRepo: typeof Comment,
    @InjectModel(Like) private likeRepo: typeof Like,
    @InjectModel(User) private userRepo: typeof User,
    private readonly i18n: I18nService,
  ) {
    this.loader = new DataLoader<number, CommnetHastageInput>(
      async (keys: number[]) => {
        const hashtags = await this.HashtagRepo.findAll({
          where: { id: { [Op.in]: keys } },
        })
        const HashtagMap = new Map(
          hashtags.map(hashtag => [hashtag.id, hashtag]),
        )

        const userIds = [...new Set(hashtags.map(hashtag => hashtag.userId))]
        const users = await this.userRepo.findAll({
          where: { id: { [Op.in]: userIds } },
        })
        const userMap = new Map(users.map(user => [user.id, user]))

        const commnetIds = [
          ...new Set(hashtags.map(hashtag => hashtag.commentId)),
        ]
        const commnets = await this.commnetRepo.findAll({
          where: { id: { [Op.in]: commnetIds } },
        })
        const commnetMap = new Map(
          commnets.map(commnet => [commnet.id, commnet]),
        )

        const postIds = [...new Set(commnets.map(commnet => commnet.postId))]
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
          const hashtag = HashtagMap.get(id).dataValues
          if (!hashtag)
            throw new NotFoundException(this.i18n.t('HashtagCommnet.NOT_FOUND'))

          const user = userMap.get(hashtag.userId).dataValues
          const commnet = commnetMap.get(hashtag.commentId).dataValues
          const post = posttMap.get(commnet.postId).dataValues
          const userPost = postUserMap.get(post.userId).dataValues
          const likes = postlikeMap.get(post?.id)?.length || 0
          const comments = commentMap
            .get(post.id)
            .map(comment => comment.dataValues)

          const result: CommnetHastageInput = {
            ...hashtag,
            user,
            commnet: {
              ...commnet,
              post: { ...post, user: userPost, comments, likes },
            },
          }

          return result
        })
      },
    )
  }

  load (id: number): Promise<CommnetHastageInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<CommnetHastageInput[]> {
    const results = await this.loader.loadMany(ids)
    return results.filter(
      (result): result is CommnetHastageInput => !(result instanceof Error),
    )
  }
}
