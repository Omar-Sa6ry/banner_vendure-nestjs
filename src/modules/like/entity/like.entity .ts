import { Field, Int, ObjectType } from '@nestjs/graphql'
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
} from 'sequelize-typescript'

@ObjectType()
@Table({
  tableName: 'likes',
  timestamps: true,
  indexes: [
    { name: 'idx_like_postId', fields: ['postId'] },
    { name: 'idx_like_userId', fields: ['userId'] },
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

  @Field(() => Int)
  @ForeignKey(() => Post)
  @Column({ type: DataType.INTEGER, allowNull: false })
  postId: number

  @Field(() => Date)
  @CreatedAt
  createdAt: Date

  @BelongsTo(() => User)
  user: User

  @BelongsTo(() => Post)
  post: Post
}
