import { Banner } from 'src/modules/banner/entity/bannner.entity'
import { InterActionType } from '../../../common/constant/enum.constant'
import { Field, Int, ObjectType } from '@nestjs/graphql'
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

@ObjectType()
@Table({
  tableName: 'interactions',
  indexes: [
    { name: 'idx_interaction_user_id', fields: ['userId'] },
    { name: 'idx_interaction_banner_id', fields: ['bannerId'] },
    { name: 'idx_interaction_type', fields: ['type'] },
    { name: 'idx_interaction_user_banner', fields: ['userId', 'bannerId'] },
  ],
})
export class Interaction extends Model<Interaction> {
  @Field(() => Int)
  @Column({ autoIncrement: true, primaryKey: true })
  id: number

  @Field(() => Int)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  userId: number

  @Field(() => Int)
  @ForeignKey(() => Banner)
  @Column({ type: DataType.INTEGER, allowNull: true })
  bannerId: number

  @Field()
  @Column({
    type: DataType.ENUM(...Object.values(InterActionType)),
    allowNull: false,
  })
  type: InterActionType

  @Field(() => Date)
  @CreatedAt
  createdAt: Date

  @BelongsTo(() => User)
  user: User

  @BelongsTo(() => Banner)
  banner: Banner
}
