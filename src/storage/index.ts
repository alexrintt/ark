import { PermissionResolvable } from 'discord.js';
import low, { AdapterSync, LowdbSync } from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

export interface SetVoiceChannelStateOptions {
  ownerId: string;
  del: boolean;
}

export interface ChannelFactoryConfig {
  template: string;
  triggerChannelId: string;
  parentCategoryId: string;
  ownerPermissions: PermissionResolvable[];
  userLimit: number;
  createPrivateChannels: boolean;
}

export interface GuildConfig {
  prefix: string;
  channelFactory: ChannelFactoryConfig;
  commandsChannelId: string;
  ruleChannelId: string;
}

export interface CallConfig {
  ownerId: string;
}

interface KeyContext {
  prefix: string;
  separator: string;
}

function generateKeyContext(prefix: string, separator: string): KeyContext {
  return {
    prefix,
    separator,
  };
}

export class BotStorage {
  static adapter: AdapterSync;
  static db: LowdbSync<GuildConfig>;

  private static guildContext = generateKeyContext('guild', '-');
  private static callContext = generateKeyContext('call', '-');
  private static defaultGuildConfig = {
    prefix: 'ark!',
    ruleChannelId: null,
    commandsChannelId: null,
    createPrivateChannels: false,
    channelFactory: {
      template: '{name}',
      userLimit: 10,
      triggerChannelId: null,
      parentCategoryId: null,
      ownerPermissions: [
        'DEAFEN_MEMBERS',
        'MANAGE_CHANNELS',
        'PRIORITY_SPEAKER',
        'MANAGE_ROLES',
      ],
    },
  };

  private static defaultDatabase = {
    // [BotStorage.getKey(BotStorage.guildContext, '820358112804339753')]: {
    //   prefix: 'ma!',
    //   ruleChannelId: null,
    //   commandsChannelId: null,
    //   createPrivateChannels: false,
    //   channelFactory: {
    //     template: '🍓◝ {name}',
    //     userLimit: 10,
    //     triggerChannelId: '820430604759859240',
    //     parentCategoryId: '820368474823196694',
    //     ownerPermissions: [
    //       'DEAFEN_MEMBERS',
    //       'MANAGE_CHANNELS',
    //       'PRIORITY_SPEAKER',
    //       'MANAGE_ROLES',
    //     ],
    //   },
    // },
  };

  static async init(): Promise<void> {
    this.adapter = new FileSync('./db.json');

    this.db = low(this.adapter);

    this.db.defaults(this.defaultDatabase).write();
  }

  private static getKey(context: KeyContext, id: string) {
    return `${context.prefix}${context.separator}${id}`;
  }

  static readKey<T extends any>(key: string): T {
    return this.db.get(key).value();
  }

  static writeKey<T>(key: string, value: T): Promise<void> {
    return this.db.set(key, value).write();
  }

  private static async updateGuildConfigData(
    guildId: string,
    getNewGuildConfig: (currentConfig: GuildConfig) => GuildConfig
  ): Promise<void> {
    const key = this.getKey(this.guildContext, guildId);

    const currentConfig = this.readKey<GuildConfig>(key);

    return this.db.set(key, getNewGuildConfig(currentConfig)).write();
  }

  static async updateGuildPrefix(guildId: string, newPrefix: string) {
    return this.updateGuildConfigData(guildId, (currentConfig) => {
      return {
        ...currentConfig,
        prefix: newPrefix,
      };
    });
  }

  static async getGuildConfig(guildId: string): Promise<GuildConfig> {
    return this.readKey(this.getKey(this.guildContext, guildId));
  }

  static async registerNewGuild(guildId: string): Promise<void> {
    this.db
      .set(this.getKey(this.guildContext, guildId), this.defaultGuildConfig)
      .write();
  }

  static get updateGuildConfig() {
    return {
      triggerChannelId: (guildId: string, newChannelTriggerId: string) => {
        return this.updateGuildConfigData(guildId, (currentConfig) => {
          return {
            ...currentConfig,
            channelFactory: {
              ...currentConfig.channelFactory,
              triggerChannelId: newChannelTriggerId,
            },
          };
        });
      },
      parentCategoryId: (guildId: string, newParentCategoryId: string) => {
        return this.updateGuildConfigData(guildId, (currentConfig) => {
          return {
            ...currentConfig,
            channelFactory: {
              ...currentConfig.channelFactory,
              parentCategoryId: newParentCategoryId,
            },
          };
        });
      },
      template: (guildId: string, newTemplate: string) => {
        return this.updateGuildConfigData(guildId, (currentConfig) => {
          return {
            ...currentConfig,
            channelFactory: {
              ...currentConfig.channelFactory,
              template: newTemplate,
            },
          };
        });
      },
      ownerPermissions: (
        guildId: string,
        newOwnerPermissions: PermissionResolvable[]
      ) => {
        return this.updateGuildConfigData(guildId, (currentConfig) => {
          return {
            ...currentConfig,
            channelFactory: {
              ...currentConfig.channelFactory,
              ownerPermissions: newOwnerPermissions,
            },
          };
        });
      },
      userLimit: (guildId: string, newUserLimit: number) => {
        return this.updateGuildConfigData(guildId, (currentConfig) => {
          return {
            ...currentConfig,
            channelFactory: {
              ...currentConfig.channelFactory,
              userLimit: newUserLimit,
            },
          };
        });
      },
      ruleChannelId: (guildId: string, newRuleChannelId: string) => {
        return this.updateGuildConfigData(guildId, (currentConfig) => {
          return {
            ...currentConfig,
            ruleChannelId: newRuleChannelId,
          };
        });
      },
      commandsChannelId: (guildId: string, newCommandsChannelId: string) => {
        return this.updateGuildConfigData(guildId, (currentConfig) => {
          return {
            ...currentConfig,
            commandsChannelId: newCommandsChannelId,
          };
        });
      },
      createPrivateChannels: (
        guildId: string,
        newCreatePrivateChannels: boolean
      ) => {
        return this.updateGuildConfigData(guildId, (currentConfig) => {
          return {
            ...currentConfig,
            channelFactory: {
              ...currentConfig.channelFactory,
              createPrivateChannels: newCreatePrivateChannels,
            },
          };
        });
      },
    };
  }

  static async setChannelState(
    channelId: string,
    ownerId: string
  ): Promise<void> {
    this.db
      .set(this.getKey(this.callContext, channelId), {
        ownerId,
      })
      .write();
  }

  static async deleteVoiceChannel(channelId: string): Promise<void> {
    this.db.unset(this.getKey(this.callContext, channelId)).write();
  }

  static async getVoiceChannelState(channelId: string): Promise<CallConfig> {
    return this.readKey(this.getKey(this.callContext, channelId));
  }
}
