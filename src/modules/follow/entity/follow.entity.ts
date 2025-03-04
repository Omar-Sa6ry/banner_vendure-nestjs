import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Status } from 'src/common/constant/enum.constant'
import { User } from 'src/modules/users/entity/user.entity'
import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  DataType,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript'

@ObjectType()
@Table({
  tableName: 'follows',
  indexes: [
    {
      name: 'idx_follower_following',
      unique: true,
      fields: ['followerId', 'followingId'],
    },
  ],
})
export class Follow extends Model<Follow> {
  @Field(() => Int)
  @Column({ autoIncrement: true, primaryKey: true })
  id: number

  @Column({
    type: DataType.ENUM(...Object.values(Status)),
    defaultValue: Status.PENDING,
    allowNull: false,
  })
  status: Status

  @Field(() => Int)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  followerId: number

  @Field(() => Int)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  followingId: number

  @BelongsTo(() => User, { foreignKey: 'followerId', onDelete: 'CASCADE' })
  follower: User

  @BelongsTo(() => User, { foreignKey: 'followingId', onDelete: 'CASCADE' })
  following: User

  @CreatedAt
  @Field(() => Date)
  createdAt: Date

  @UpdatedAt
  @Field(() => Date)
  updatedAt: Date
}
