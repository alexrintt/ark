import { Message } from 'discord.js';
import { GuildConfig } from '../../storage';

export function textChannelAdminCommandGuard(
  message: Message,
  guildConfig?: GuildConfig
) {
  const isAdmin = !!message?.member?.hasPermission('ADMINISTRATOR');

  const isDm = !message.guild;

  const canUseThisChannel =
    !isDm &&
    (guildConfig?.commandsChannelId
      ? guildConfig.commandsChannelId === message.channel.id
      : true);

  return isAdmin && canUseThisChannel;
}
