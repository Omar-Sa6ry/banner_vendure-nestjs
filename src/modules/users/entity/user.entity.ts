import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Role, UserStatus } from 'src/common/constant/enum.constant'
import { Exclude } from 'class-transformer'
import { Partner } from 'src/modules/partner/entity/partner.entity'
import { Interaction } from 'src/modules/interaction/entity/interaction.entity'
import { Like } from 'src/modules/like/entity/like.entity '
import { Vendor } from 'src/modules/vendour/entity/vendour.entity'
import { Buyer } from 'src/modules/buyer/entity/buyer.entity'
import { Reply } from 'src/modules/reply/entity/reply.entity'
import { Message } from 'src/modules/message/entity/message.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Post } from 'src/modules/post/entity/post.entity '
import {
  Table,
  Column,
  Model,
  DataType,
  Index,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript'

@ObjectType()
@Table({ tableName: 'user', timestamps: true })
export class User extends Model<User> {
  @Field(() => Int)
  @Column({ autoIncrement: true, primaryKey: true })
  id: number

  @Field(() => String)
  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  @Index
  userName: string

  @Field(() => String)
  @Column({ type: DataType.STRING, allowNull: true })
  @Index
  avatar: string

  @Field(() => String)
  @Column({ type: DataType.STRING, allowNull: true })
  bio: string

  @Field(() => String)
  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  @Index
  phone: string

  @Field(() => String)
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  @Index
  email: string

  @Field()
  @Column({
    type: DataType.ENUM(...Object.values(UserStatus)),
    defaultValue: UserStatus.PUBLIC,
  })
  status: UserStatus

  @Exclude()
  @Column({ type: DataType.STRING, allowNull: false })
  password: string

  @Exclude()
  @Column({
    type: DataType.ENUM(...Object.values(Role)),
    defaultValue: Role.USER,
  })
  role: Role

  @Exclude()
  @Column({ type: DataType.STRING, allowNull: true })
  resetToken?: string

  @Exclude()
  @Column({ type: DataType.DATE, allowNull: true })
  resetTokenExpiry?: Date | null

  @Exclude()
  @Column({ type: DataType.STRING, allowNull: true })
  fcmToken?: string

  @CreatedAt
  @Field(() => Date)
  createdAt: Date

  @UpdatedAt
  @Field(() => Date)
  updatedAt: Date

  @HasMany(() => Campaign)
  campaign: Campaign[]

  @HasMany(() => Partner)
  partner: Partner[]

  @HasMany(() => Message)
  recievers: Message[]

  @HasMany(() => Message)
  senders: Message[]

  @HasMany(() => Interaction)
  interactions: Interaction[]

  @HasMany(() => Vendor)
  vendors: Vendor[]

  @HasMany(() => Post)
  posts: Post[]

  @HasMany(() => Like)
  likes: Like[]

  @HasMany(() => Reply)
  replies: Reply[]

  @HasMany(() => Buyer)
  buyers: Buyer[]
}
