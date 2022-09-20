import {
  Client,
  Guild,
  GuildMember,
  Message,
  PermissionResolvable,
  User,
  VoiceState,
} from 'discord.js';
import BotConfig from './bot-config';

import { CommandFactory } from './commands/factory/command-factory';
import { GuildConfig, BotStorage } from './storage';

export class DiscordBot {
  private static instance: DiscordBot;

  private client: Client = new Client();

  private commandFactory: CommandFactory = new CommandFactory(this.client);

  static getInstance(): DiscordBot {
    if (!DiscordBot.instance) {
      DiscordBot.instance = new DiscordBot();
    }

    return DiscordBot.instance;
  }

  async connect(): Promise<void> {
    try {
      await this.client.login(BotConfig.DISCORD_CLIENT_SECRET);

      console.log('Connected to Discord');
    } catch (error) {
      console.error(`Could not connect. Error: ${(error as any).message}`);
    }
  }

  async initializeClient(): Promise<void> {
    if (!this.client) return;

    await BotStorage.init();

    this.setReadyHandler();
    this.setMessageHandler();
    this.setVoiceStateHandler();
    this.setGuildJoinHandler();
  }

  private setGuildJoinHandler(): void {
    this.client.on('guildCreate', async (guild) => {
      console.log(`The client joins a guild`);

      BotStorage.registerNewGuild(guild.id);
    });
  }

  private setReadyHandler(): void {
    this.client.on('ready', async () => {
      console.log('Discord Bot connected');

      await this.client.user?.setActivity({
        name: `ark! help | ark! config`,
        type: 'LISTENING',
      });
    });
  }

  private setVoiceStateHandler(): void {
    async function createChannel(
      guild: Guild,
      user: User,
      {
        channelFactory: {
          template,
          parentCategoryId,
          ownerPermissions,
          userLimit,
          createPrivateChannels,
        },
      }: GuildConfig
    ) {
      const name = template.replace('{name}', user.username);

      const makePrivate: PermissionResolvable[] = [
        'CONNECT',
        'SPEAK',
        'VIEW_CHANNEL',
        'CREATE_INSTANT_INVITE',
      ];

      const voiceChannel = await guild.channels.create(name, {
        type: 'voice',
        parent: parentCategoryId,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [
              ...ownerPermissions,
              ...(createPrivateChannels ? makePrivate : []),
            ],
          },
          {
            id: user.id,
            allow: ownerPermissions,
          },
        ],
        userLimit,
      });

      BotStorage.setChannelState(voiceChannel.id, user.id);

      return voiceChannel;
    }

    const onVoiceStateUpdate = async (
      oldMemberState: VoiceState,
      newMemberState: VoiceState
    ) => {
      /// Get current user voice channel ID
      const newUserChannel = newMemberState.channelID;

      /// Channel ID that user leaved
      const oldUserChannel = oldMemberState.channelID;

      if (oldUserChannel === newUserChannel) return;

      if (!newMemberState?.member?.user) return;

      const guild = newMemberState?.member.guild;

      const guildId = guild.id;

      const guildConfig = await BotStorage.getGuildConfig(guildId);

      const {
        channelFactory: {
          triggerChannelId,
          parentCategoryId,
          ownerPermissions,
        },
      } = guildConfig;

      if (oldUserChannel === triggerChannelId) return;

      if (newUserChannel === triggerChannelId) {
        const voiceChannel = await createChannel(
          guild,
          newMemberState.member.user,
          guildConfig
        );

        await newMemberState.member.voice.setChannel(voiceChannel.id);
      }

      if (oldUserChannel === triggerChannelId) return;

      const channel = await guild.channels.cache.get(oldUserChannel as string);

      if (!channel) return;

      if (channel?.parent?.id !== parentCategoryId) return;

      const members = channel && channel.members;

      const isEmpty = channel && members.size === 0;

      if (isEmpty) {
        BotStorage.deleteVoiceChannel(channel.id);

        await channel.delete();
      } else if (members) {
        const callState = await BotStorage.getVoiceChannelState(channel.id);

        if (oldMemberState?.member?.id !== callState.ownerId) return;

        const newOwner = members.first() as GuildMember;

        const generatePermissionsWith = (value: boolean | null) => {
          const permissions: { [K: string]: boolean | null } = {};

          for (const permissionName of ownerPermissions) {
            permissions[permissionName.toString()] = value;
          }

          return permissions;
        };

        await channel.updateOverwrite(
          oldMemberState.member,
          generatePermissionsWith(null)
        );
        await channel.updateOverwrite(newOwner, generatePermissionsWith(true));

        BotStorage.setChannelState(channel.id, newOwner.id);
      }
    };

    this.client.on('voiceStateUpdate', onVoiceStateUpdate);
  }

  private setMessageHandler(): void {
    this.client.on('message', async (message: Message) => {
      //* Filters out requests from bots and other prefixes
      if (message.author.bot) return;

      const guildId = message.member?.guild?.id;

      const guildConfig = guildId
        ? await BotStorage.getGuildConfig(guildId)
        : undefined;

      const prefix = guildConfig?.prefix ?? 'ark!';

      if (message.content.indexOf(prefix) !== 0) return;

      const command = this.commandFactory.createCommand(message, guildConfig);

      if (!command) {
        message.channel.send(
          `Comando não registrado, digite \`${prefix} help\` para ver a lista de comandos`
        );
        return;
      }

      if (command.canExecute()) {
        await command.execute();
      } else {
        ///! Handle no permissions command
      }
    });
  }
}
