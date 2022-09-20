import { Client, Message } from 'discord.js';

import { Command, CommandType } from './command';
import { PingCommand } from '../implementation/ping.command';
import { SayCommand } from '../implementation/say.command';
import { SetCommand } from '../implementation/set.command';
import { GuildConfig } from '../../storage';
import { ConfigCommand } from '../implementation/config';

export class CommandFactory {
  constructor(private client: Client) {}

  createCommand(message: Message, guildConfig?: GuildConfig): Command | null {
    const [keyword, args] = this.parseCommand(
      message.content,
      guildConfig?.prefix ?? 'ma!'
    );

    switch (keyword) {
      case CommandType.say:
        return new SayCommand(message, args);

      case CommandType.ping:
        return new PingCommand(message, this.client);

      case CommandType.set:
        return new SetCommand(message, args, guildConfig);

      case CommandType.config:
        return new ConfigCommand(message, args, guildConfig);

      default:
        return null;
    }
  }

  private parseCommand(
    messageContent: string,
    prefix: string
  ): [CommandType, string[]] {
    const args = messageContent
      .slice(prefix.length)
      // Add line above to keep only letters
      // .replace(/[\W_]+/g, ' ')
      .trim()
      .split(/ +/g);

    const keyword = args.shift()?.toLowerCase() ?? '';
    const commandType = CommandType[keyword as keyof typeof CommandType];

    return [commandType, args];
  }
}
