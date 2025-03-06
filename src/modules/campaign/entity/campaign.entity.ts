import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Transform } from 'class-transformer'
import { User } from 'src/modules/users/entity/user.entity'
import { CampaignStatus } from '../../../common/constant/enum.constant'
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
import { Partner } from 'src/modules/partner/entity/partner.entity'
import { Banner } from 'src/modules/banner/entity/bannner.entity'
import { Vendor } from 'src/modules/vendour/entity/vendour.entity'

@ObjectType()
@Table({
  tableName: 'campaigns',
  timestamps: true,
  indexes: [
    { name: 'idx_campaign_name', fields: ['name'] },
    { name: 'idx_campaign_status', fields: ['status'] },
    { name: 'idx_campaign_start_date', fields: ['startDate'] },
    { name: 'idx_campaign_end_date', fields: ['endDate'] },
    { name: 'idx_campaign_created_at', fields: ['createdAt'] },
  ],
})
export class Campaign extends Model<Campaign> {
  @Field(() => Int)
  @Column({ autoIncrement: true, primaryKey: true })
  id: number

  @Field()
  @Column({ type: DataType.STRING, allowNull: false })
  name: string

  @Field()
  @Column({ type: DataType.TEXT, allowNull: false })
  description: string

  @Field()
  @Column({ type: DataType.DATE, allowNull: false })
  startDate: Date

  @Field()
  @Column({ type: DataType.DATE, allowNull: false })
  endDate: Date

  @Field()
  @Column({
    type: DataType.ENUM(...Object.values(CampaignStatus)),
    defaultValue: CampaignStatus.PENDING,
  })
  status: CampaignStatus

  @Field(() => Int)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number

  @Field()
  @CreatedAt
  @Transform(({ value }) => (value ? new Date(value).toLocaleString() : null), {
    toClassOnly: true,
  })
  createdAt: Date

  @Field()
  @UpdatedAt
  @Transform(({ value }) => (value ? new Date(value).toLocaleString() : null), {
    toClassOnly: true,
  })
  updatedAt: Date

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  @Field(() => User)
  user: User

  @HasMany(() => Banner)
  banners: Banner[]

  @HasMany(() => Partner)
  partners: Partner[]

  @HasMany(() => Vendor)
  vendors: Vendor[]
}
