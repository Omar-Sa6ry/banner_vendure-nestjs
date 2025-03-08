import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { MessageService } from './message.service'
import { Message } from './entity/message.entity'
import { CreateMessageDto } from './dto/CreateMessage.dto'
import { Auth } from 'src/common/decerator/auth.decerator'
import { Role } from 'src/common/constant/enum.constant'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { MessageResponse, MessagesResponse } from './dto/message.response'

@Resolver(() => Message)
export class MessageResolver {
  constructor (private readonly messageService: MessageService) {}

  @Mutation(() => MessageResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async sendMessage (
    @CurrentUser() user: CurrentUserDto,
    @Args('createMessageDto') createMessageDto: CreateMessageDto,
  ): Promise<MessageResponse> {
    return await this.messageService.send(user.id, createMessageDto)
  }

  @Query(() => MessagesResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async chat (
    @CurrentUser() user: CurrentUserDto,
    @Args('receiverId', { type: () => Int }) receiverId: number,
  ): Promise<MessagesResponse> {
    return await this.messageService.chat(user.id, receiverId)
  }

  @Query(() => MessagesResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async userMessages (
    @CurrentUser() user: CurrentUserDto,
  ): Promise<MessagesResponse> {
    return await this.messageService.userMessages(user.id)
  }

  @Mutation(() => MessageResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async markMessageAsRead (
    @CurrentUser() user: CurrentUserDto,
    @Args('receiverId', { type: () => Int }) receiverId: number,
  ): Promise<MessageResponse> {
    return this.messageService.markMessageRead(user.id, receiverId)
  }

  @Query(() => MessagesResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async unreadMessages (
    @CurrentUser() user: CurrentUserDto,
    @Args('receiverId', { type: () => Int }) receiverId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<MessagesResponse> {
    return await this.messageService.gotNotRead(
      user.id,
      receiverId,
      page,
      limit,
    )
  }

  @Mutation(() => MessageResponse)
  @Auth(Role.USER, Role.VENDOR, Role.PARTNER, Role.ADMIN, Role.MANAGER)
  async deleteMessage (
    @CurrentUser() user: CurrentUserDto,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<MessageResponse> {
    return this.messageService.deleteMessage(user.id, id)
  }
}
