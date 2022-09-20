import { Message } from 'discord.js';

import { Command, CommandType } from '../factory/command';

export class SayCommand extends Command {
  constructor(private message: Message, private args: string[]) {
    super();
  }

  async execute(): Promise<void> {
    if (this.canExecute()) {
      try {
        await this.message.channel.send(this.args.join(' '));
      } catch (err) {
        console.error(
          `Could not execute command Say. Error: ${(err as any).message}`
        );
      }
    }
  }

  canExecute(): boolean {
    return this.message.member?.hasPermission('ADMINISTRATOR') ?? false;
  }
}
