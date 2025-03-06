import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Banner } from 'src/modules/banner/entity/bannner.entity'
import { User } from 'src/modules/users/entity/user.entity'
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
  tableName: 'vendors',
  indexes: [
    {
      name: 'idx_vendour',
      unique: true,
      fields: ['bannerId', 'userId'],
    },
  ],
})
export class Vendor extends Model<Vendor> {
  @Field(() => Int)
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id: number

  @Field(() => Int)
  @ForeignKey(() => Banner)
  @Column({ type: DataType.INTEGER, allowNull: false })
  bannerId: number

  @Field(() => Int)
  @ForeignKey(() => Campaign)
  @Column({ type: DataType.INTEGER, allowNull: false })
  campaignId: number

  @Field(() => Int)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number

  @Field()
  @CreatedAt
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  createdAt: Date

  @Field()
  @UpdatedAt
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  updatedAt: Date

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  user: User

  @BelongsTo(() => Campaign, { onDelete: 'CASCADE' })
  campaign: Campaign

  @BelongsTo(() => Banner, { onDelete: 'CASCADE' })
  banner: Banner
}
