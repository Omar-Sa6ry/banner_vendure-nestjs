import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Reply } from 'src/modules/reply/entity/reply.entity'
import { User } from 'src/modules/users/entity/user.entity'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { Post } from 'src/modules/post/entity/post.entity '
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript'

@ObjectType()
@Table({
  tableName: 'mentions',
  indexes: [
    {
      name: 'idx_post_mention',
      fields: ['postId', 'mentionFrom', 'mentionTo'],
      unique: true,
    },
    {
      name: 'idx_comment_mention',
      fields: ['commentId', 'mentionFrom', 'mentionTo'],
      unique: true,
    },
    {
      name: 'idx_reply_mention',
      fields: ['replyId', 'mentionFrom', 'mentionTo'],
      unique: true,
    },
  ],
})
export class Mention extends Model<Mention> {
  @Field(() => Int)
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id: number

  @Field(() => Int, { nullable: true })
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  mentionFromId: number

  @Field(() => Int, { nullable: true })
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  mentionToId: number

  @Field(() => Int, { nullable: true })
  @ForeignKey(() => Post)
  @Column({ type: DataType.INTEGER, allowNull: true })
  postId: number

  @Field(() => Int, { nullable: true })
  @ForeignKey(() => Comment)
  @Column({ type: DataType.INTEGER, allowNull: true })
  commentId: number

  @Field(() => Int, { nullable: true })
  @ForeignKey(() => Reply)
  @Column({ type: DataType.INTEGER, allowNull: true })
  replyId: number

  @BelongsTo(() => Comment)
  comment: Comment

  @BelongsTo(() => Reply)
  reply: Reply

  @BelongsTo(() => User)
  from: User

  @BelongsTo(() => User)
  to: User

  @BelongsTo(() => Post)
  post: Post

  @Field(() => Date)
  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdAt: Date
}
