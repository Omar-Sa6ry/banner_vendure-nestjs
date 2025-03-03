import { Field, Int } from '@nestjs/graphql'
import { Partner } from 'src/modules/partner/entity/partner.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  DataType,
} from 'sequelize-typescript'

@Table({
  tableName: 'banners',
  indexes: [
    {
      name: 'idx_banner_page_position',
      unique: true,
      fields: ['page', 'position'],
    },
  ],
})
export class Banner extends Model<Banner> {
  @Column({ autoIncrement: true, primaryKey: true })
  @Field(() => Int)
  id: number

  @ForeignKey(() => Partner)
  @Column({ type: DataType.INTEGER, allowNull: false })
  @Field(() => Int)
  createdBy: number

  @ForeignKey(() => Campaign)
  @Column({ type: DataType.INTEGER, allowNull: true })
  @Field(() => Int)
  campaignId: number

  @Column({ type: DataType.INTEGER, allowNull: false })
  @Field(() => Int)
  position: number

  @Column({ type: DataType.INTEGER, allowNull: false })
  @Field(() => Int)
  page: number

  @Column({ type: DataType.STRING, allowNull: false })
  @Field(() => String)
  image_ar: string

  @Column({ type: DataType.STRING, allowNull: false })
  @Field(() => String)
  image_en: string

  @Column({ type: DataType.STRING, allowNull: true })
  @Field(() => String)
  redirect: string

  @Column({ type: DataType.STRING, allowNull: true })
  @Field(() => String)
  url_ar: string

  @Column({ type: DataType.STRING, allowNull: true })
  @Field(() => String)
  url_en: string

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  @Field(() => Boolean)
  is_active: boolean

  @CreatedAt
  @Field(() => Date)
  createdAt: Date

  @UpdatedAt
  @Field(() => Date)
  updatedAt: Date

  @BelongsTo(() => Partner)
  creator: Partner

  @BelongsTo(() => Campaign)
  campaign: Campaign
}
