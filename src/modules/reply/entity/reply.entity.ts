import { Field, Int, ObjectType } from '@nestjs/graphql'
import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  DataType,
  CreatedAt,
  HasMany,
} from 'sequelize-typescript'
import { Comment } from 'src/modules/comment/entity/comment.entity '
import { Like } from 'src/modules/like/entity/like.entity '
import { User } from 'src/modules/users/entity/user.entity'

@ObjectType()
@Table({
  tableName: 'replies',
  indexes: [
    { name: 'idx_reply_userId', fields: ['userId'] },
    { name: 'idx_reply_commentId', fields: ['commentId'] },
  ],
  timestamps: true,
})
export class Reply extends Model<Reply> {
  @Field(() => Int)
  @Column({
    primaryKey: true,
    autoIncrement: true,
    type: DataType.INTEGER,
  })
  id: number

  @Field(() => String)
  @Column({ type: DataType.TEXT, allowNull: true })
  content: string

  @Field(() => Int)
  @ForeignKey(() => Comment)
  @Column({ type: DataType.INTEGER, allowNull: true })
  commentId: number

  @Field(() => Int)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  userId: number

  @Field(() => Date)
  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date

  @BelongsTo(() => Comment, { onDelete: 'CASCADE' })
  comment: Comment

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  user: User

  @HasMany(() => Like, {foreignKey: 'replyId', onDelete: 'SET NULL' })
  likes: Like[]

  // @HasMany(() => Hashtag, { foreignKey: 'replyId', onDelete: 'SET NULL' })
  // hashtags: Hashtag[]

  // @HasMany(() => Mention, { foreignKey: 'replyId', onDelete: 'SET NULL' })
  // mentionReply: Mention[]
}
