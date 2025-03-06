import { Banner } from 'src/modules/banner/entity/bannner.entity'
import { Int, Field, ObjectType } from '@nestjs/graphql'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { User } from 'src/modules/users/entity/user.entity'
import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  DataType,
  HasMany,
} from 'sequelize-typescript'

@ObjectType()
@Table({
  tableName: 'partners',
  timestamps: true,
})
export class Partner extends Model<Partner> {
  @Field(() => Int)
  @Column({ autoIncrement: true, primaryKey: true })
  id: number

  @Field(() => Int)
  @ForeignKey(() => Campaign)
  @Column({ type: DataType.INTEGER, allowNull: false })
  campaignId: number

  @Field(() => Int)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number

  @Field(() => Date)
  @CreatedAt
  createdAt: Date

  @BelongsTo(() => Campaign, { onDelete: 'CASCADE' })
  campaign: Campaign

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  user: User

  @HasMany(() => Banner)
  banners: Banner[]
}
