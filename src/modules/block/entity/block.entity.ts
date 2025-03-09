import { Field, Int, ObjectType } from '@nestjs/graphql'
import { User } from 'src/modules/users/entity/user.entity'
import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript'

@ObjectType()
@Table({
  tableName: 'blocks',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['blockerId', 'blockingId'],
      name: 'idx_blocker_blocking',
    },
    { fields: ['blockerId'], name: 'idx_blocker' },
    { fields: ['blockingId'], name: 'idx_blocking' },
  ],
})
export class Block extends Model<Block> {
  @Field(() => Int)
  @Column({ autoIncrement: true, primaryKey: true })
  id: number

  @Field(() => Int)
  @ForeignKey(() => User)
  @Column
  blockerId: number

  @Field(() => Int)
  @ForeignKey(() => User)
  @Column
  blockingId: number

  @CreatedAt
  @Field(() => Date)
  createdAt: Date

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  blocker: User

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  blocking: User
}
