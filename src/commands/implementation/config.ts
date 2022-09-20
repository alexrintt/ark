import { Message, MessageEmbedOptions } from 'discord.js';
import { GuildConfig } from '../../storage';

import { Command } from '../factory/command';
import { textChannelAdminCommandGuard } from '../guard/admin';

export class ConfigCommand extends Command {
  constructor(
    private message: Message,
    private args: string[],
    private guildConfig?: GuildConfig
  ) {
    super();
  }

  async execute(): Promise<void> {
    if (this.canExecute()) {
      try {
        const guildConfig = this.guildConfig as GuildConfig;

        const embed: MessageEmbedOptions = {
          title: 'Configuração atual do servidor',
          color: 10166248,
          footer: {
            icon_url: this.message.client.user?.avatarURL() ?? undefined,
            text: this.message.guild?.name,
          },
          timestamp: new Date(Date.now()),
          fields: [
            {
              name: 'Prefixo deste servidor',
              value: guildConfig.prefix,
            },
            {
              name: 'Canal de regras',
              value: guildConfig.ruleChannelId
                ? `<#${guildConfig.ruleChannelId}>`
                : 'Sem canal definido ainda',
            },
            {
              name: 'Canal permitido para usar comandos',
              value: guildConfig.commandsChannelId
                ? `<#${guildConfig.commandsChannelId}>`
                : 'Sem canal definido ainda',
            },
            {
              name: 'Criador de call',
              value: guildConfig.channelFactory.triggerChannelId
                ? `<#${guildConfig.channelFactory.triggerChannelId}>`
                : 'Sem canal definido ainda',
            },
            {
              name: 'Criador de call está criando...',
              value: guildConfig.channelFactory.createPrivateChannels
                ? `Calls _privadas_`
                : `Calls _públicas_`,
            },
            {
              name: 'Categoria do canal do criador de calls',
              value: guildConfig.channelFactory.parentCategoryId
                ? `<#${guildConfig.channelFactory.parentCategoryId}>`
                : 'Sem categoria definida ainda',
            },
            {
              name: 'Template usado para criar call',
              value: `\`${guildConfig.channelFactory.template}\``,
            },
            {
              name: 'Permissões do dono da call',
              value: guildConfig.channelFactory.ownerPermissions.join(', '),
            },
            {
              name: 'Limite de usuários padrão do criador de calls',
              value:
                guildConfig.channelFactory.userLimit ??
                'Sem limite padrão definido',
            },
          ],
        };

        this.message.channel.send({
          embed,
        });
      } catch (err) {
        console.error(
          `Could not execute command Config. Error: ${(err as any).message}`
        );
      }
    }
  }

  canExecute(): boolean {
    return textChannelAdminCommandGuard(this.message, this.guildConfig);
  }
}
