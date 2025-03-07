import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Post } from 'src/modules/post/entity/post.entity '
import { Reply } from 'src/modules/reply/entity/reply.entity'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { User } from 'src/modules/users/entity/user.entity'
import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  DataType,
} from 'sequelize-typescript'

@ObjectType()
@Table({
  tableName: 'likes',
  timestamps: true,
  indexes: [
    { name: 'idx_likes_postId', fields: ['postId'] },
    // { name: 'idx_likes_replyId', fields: ['replyId'] },
    // { name: 'idx_like_commentId', fields: ['commentId'] },
    { name: 'idx_likes_userId', fields: ['userId'] },
  ],
})
export class Like extends Model<Like> {
  @Field(() => Int)
  @Column({ autoIncrement: true, primaryKey: true })
  id: number

  @Field(() => Int)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number

  @Field(() => Int, { nullable: true })
  @ForeignKey(() => Post)
  @Column({ type: DataType.INTEGER, allowNull: true })
  postId: number

  @Field(() => Int, { nullable: true })
  @ForeignKey(() => Reply)
  @Column({ type: DataType.INTEGER, allowNull: true })
  replyId: number

  @Field(() => Int, { nullable: true })
  @ForeignKey(() => Comment)
  @Column({ type: DataType.INTEGER, allowNull: true })
  commentId: number

  @Field(() => Date)
  @CreatedAt
  createdAt: Date

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  user: User

  @BelongsTo(() => Post, { onDelete: 'CASCADE' })
  post: Post

  @BelongsTo(() => Comment, { onDelete: 'CASCADE' })
  comment: Comment

  @BelongsTo(() => Reply, { onDelete: 'CASCADE' })
  reply: Reply
}
