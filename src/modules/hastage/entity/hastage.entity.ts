import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Transform } from 'class-transformer'
import { Reply } from 'src/modules/reply/entity/reply.entity'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { Post } from 'src/modules/post/entity/post.entity '
import { User } from 'src/modules/users/entity/user.entity'
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript'

@Table({ tableName: 'hashtags', timestamps: true })
@ObjectType()
export class Hashtag extends Model<Hashtag> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  @Field(() => Int)
  id: number

  @Column({ type: DataType.STRING, allowNull: false })
  @Field(() => String)
  content: string

  @Column({ allowNull: true, type: DataType.INTEGER })
  @Field(() => Int)
  userId: number

  @Column({ allowNull: true, type: DataType.INTEGER })
  @Field(() => Int)
  postId: number

  @Column({ allowNull: true, type: DataType.INTEGER })
  @Field(() => Int)
  commentId: number

  @Column({ allowNull: true, type: DataType.INTEGER })
  @Field(() => Int)
  replyId: number

  @BelongsTo(() => Comment, { foreignKey: 'commentId', onDelete: 'SET NULL' })
  comment: Comment

  @BelongsTo(() => User, { foreignKey: 'userId', onDelete: 'SET NULL' })
  user: User

  @BelongsTo(() => Reply, { foreignKey: 'replyId', onDelete: 'SET NULL' })
  reply: Reply

  @BelongsTo(() => Post, { foreignKey: 'postId', onDelete: 'SET NULL' })
  post: Post

  @CreatedAt
  @Column({ type: DataType.DATE })
  @Transform(({ value }) => new Date(value).toLocaleString(), {
    toClassOnly: true,
  })
  createdAt: Date
}
