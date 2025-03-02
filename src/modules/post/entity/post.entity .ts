import { User } from 'src/modules/users/entity/user.entity'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  DataType,
  HasMany,
} from 'sequelize-typescript'
import { Like } from 'src/modules/like/entity/like.entity '

@ObjectType()
@Table
export class Post extends Model<Post> {
  @Field(() => Int)
  @Column({ autoIncrement: true, primaryKey: true })
  id: number

  @Field(() => String)
  @Column({ type: DataType.STRING })
  imageUrl: string

  @Field(() => String)
  @Column({ type: DataType.STRING })
  content: string

  @Field(() => Int)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER })
  userId: number

  @Field(() => Date)
  @CreatedAt
  createdAt: Date

  @Field(() => Date)
  @UpdatedAt
  updatedAt: Date

  @BelongsTo(() => User)
  user: User

  @HasMany(() => Like)
  likes: Like[]
}
