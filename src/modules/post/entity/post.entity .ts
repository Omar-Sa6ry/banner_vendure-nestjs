import { Like } from 'src/modules/like/entity/like.entity '
import { Banner } from 'src/modules/banner/entity/bannner.entity'
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

@ObjectType()
@Table({ timestamps: true })
export class Post extends Model<Post> {
  @Field(() => Int)
  @Column({ autoIncrement: true, primaryKey: true })
  id: number

  @Field(() => String)
  @Column({ type: DataType.STRING })
  content: string

  @Field(() => Int)
  @ForeignKey(() => Banner)
  @Column({ type: DataType.INTEGER })
  bannerId: number

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

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  user: User

  @BelongsTo(() => Banner, { onDelete: 'CASCADE' })
  banner: Banner

  @HasMany(() => Like)
  likes: Like[]
}
