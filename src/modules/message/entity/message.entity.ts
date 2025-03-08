import { Field, Int, ObjectType } from '@nestjs/graphql'
import { User } from 'src/modules/users/entity/user.entity'
import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Default,
  DataType,
  CreatedAt,
} from 'sequelize-typescript'

@ObjectType()
@Table({
  tableName: 'messages',
  timestamps: true,
  indexes: [
    { name: 'idx_message_senderId', fields: ['senderId'] },
    { name: 'idx_message_receiverId', fields: ['receiverId'] },
  ],
})
export class Message extends Model<Message> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  @Field(() => Int)
  id: number

  @Column({ type: DataType.STRING, allowNull: true })
  @Field(() => String, { nullable: true })
  content: string

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  @Field(() => Boolean)
  isRead: boolean

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER })
  @Field(() => Int)
  senderId: number

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER })
  @Field(() => Int)
  receiverId: number

  @CreatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Date)
  createdAt: Date

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  sender: User

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  receiver: User
}
