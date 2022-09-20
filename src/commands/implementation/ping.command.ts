import { Client, Message } from 'discord.js';

import { Command, CommandType } from '../factory/command';

export class PingCommand extends Command {
  constructor(private message: Message, private client: Client) {
    super();
  }

  async execute(): Promise<void> {
    if (this.canExecute()) {
      try {
        await this.message.channel.send(
          `My latency is ${this.client.ws.ping}ms`
        );
      } catch (err) {
        console.error(
          `Could not execute command Say. Error: ${(err as any).message}`
        );
      }
    }
  }

  canExecute(): boolean {
    return true;
  }
}
