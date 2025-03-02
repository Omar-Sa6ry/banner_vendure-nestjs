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
} from 'sequelize-typescript'

@Table({
  tableName: 'campaign_sponsors',
  timestamps: true,
})
export class Partner extends Model<Partner> {
  @Column({ autoIncrement: true, primaryKey: true })
  id: number

  @ForeignKey(() => Campaign)
  @Column({ type: DataType.INTEGER, allowNull: false })
  campaignId: number

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number

  @CreatedAt
  createdAt: Date

  @BelongsTo(() => Campaign)
  campaign: Campaign

  @BelongsTo(() => User)
  user: User
}
