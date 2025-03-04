import { Field, Int } from '@nestjs/graphql'
import { Partner } from 'src/modules/partner/entity/partner.entity'
import { Post } from 'src/modules/post/entity/post.entity '
import { Interaction } from 'src/modules/interaction/entity/interaction.entity'
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
  HasMany,
} from 'sequelize-typescript'
import { InjectModel } from '@nestjs/sequelize'

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
  isActive: boolean

  @Column({
    type: DataType.VIRTUAL,
    get (this: Banner): number {
      if (!this.interactions) return 0
      const clicks = this.interactions.filter(i => i.type === 'click').length
      const views = this.interactions.filter(i => i.type === 'view').length
      return clicks / views
    },
  })
  @Field(() => Int)
  score: number

  @CreatedAt
  @Field(() => Date)
  createdAt: Date

  @UpdatedAt
  @Field(() => Date)
  updatedAt: Date

  @BelongsTo(() => Partner, { onDelete: 'CASCADE' })
  creator: Partner

  @BelongsTo(() => Campaign, { onDelete: 'CASCADE' })
  campaign: Campaign

  @HasMany(() => Interaction)
  interactions: Interaction[]

  @HasMany(() => Post)
  postas: Post[]
}
