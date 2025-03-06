import { Banner } from 'src/modules/banner/entity/bannner.entity'
import { User } from 'src/modules/users/entity/user.entity'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript'

@ObjectType()
@Table({
  tableName: 'buyers',
  indexes: [
    {
      name: 'idx_buyer_user_banner',
      unique: true,
      fields: ['userId', 'bannerId'],
    },
  ],
})
export class Buyer extends Model<Buyer> {
  @Field(() => Int)
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id: number

  @Field(() => Int)
  @ForeignKey(() => Banner)
  @Column({ type: DataType.INTEGER, allowNull: true })
  bannerId: number

  @Field(() => Int)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number

  @Field(() => Int)
  @Column({ type: DataType.FLOAT, allowNull: false })
  amount: number

  @Field(() => String)
  @Column({ type: DataType.STRING, allowNull: true })
  paymentMethod: string

  @Field(() => Date)
  @CreatedAt
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  createdAt: Date

  @Field(() => Date)
  @UpdatedAt
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  updatedAt: Date

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  user: User

  @BelongsTo(() => Banner, { onDelete: 'CASCADE' })
  banner: Banner
}
