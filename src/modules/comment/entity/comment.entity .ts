import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Reply } from 'src/modules/reply/entity/reply.entity'
import { Like } from 'src/modules/like/entity/like.entity '
import { Post } from 'src/modules/post/entity/post.entity '
import { User } from 'src/modules/users/entity/user.entity'
import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  DataType,
  UpdatedAt,
  HasMany,
} from 'sequelize-typescript'

@ObjectType()
@Table({
  tableName: 'comments',
  timestamps: true,
  indexes: [
    {
      name: 'idx_comment_postId_userId',
      fields: ['postId', 'userId'],
    },
  ],
})
export class Comment extends Model<Comment> {
  @Field(() => Int)
  @Column({ autoIncrement: true, primaryKey: true })
  id: number

  @Field(() => String)
  @Column({ type: DataType.STRING, allowNull: false })
  content: string

  @Field(() => Int)
  @ForeignKey(() => Post)
  @Column({ type: DataType.INTEGER, allowNull: false })
  postId: number

  @Field(() => Int, { nullable: true })
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number

  @Field(() => Date)
  @CreatedAt
  createdAt: Date

  @Field(() => Date)
  @UpdatedAt
  updatedAt: Date

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  user: User

  @BelongsTo(() => Post, { onDelete: 'CASCADE' })
  post: Post

  @HasMany(() => Reply)
  replies: Reply[]

  @HasMany(() => Like, { foreignKey: 'commentId', onDelete: 'SET NULL' })
  likes: Like[]
}
