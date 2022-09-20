import { Message } from 'discord.js';
import { BotStorage, GuildConfig } from '../../storage';

import { Command } from '../factory/command';
import { textChannelAdminCommandGuard } from '../guard/admin';

export class SetCommand extends Command {
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
        const secondaryCommand = this.args[0];

        const guildConfig = this.guildConfig as GuildConfig;

        const mapCommand: { [K: string]: () => Promise<void> } = {
          ['criador.limite']: async () => {
            const arg = this.args[1];

            if (arg === 'none') {
              await this.message.channel.send(
                '**Limite removido para o criador de calls com sucesso.**'
              );
              return;
            }

            const newLimit = Number(arg);

            if (isNaN(newLimit) || newLimit <= 1 || newLimit >= 99) {
              await this.message.channel.send(
                `**Use esse comando com um número válido entre 1 e 99, exemplo:**\n\`\`\`${guildConfig.prefix} set criador.limite 10\`\`\``
              );
              return;
            }

            await BotStorage.updateGuildConfig.userLimit(
              this.message.guild?.id as string,
              newLimit
            );

            await this.message.channel.send(
              `Limite padrão para o criador de call atualizado com sucesso, novo limite: ${newLimit}`
            );
          },
          ['criador.template']: async () => {
            const newTemplate = this.args.slice(1).join(' ');

            if (!newTemplate?.length) {
              await this.message.channel.send(
                `**Use um template válido, exemplo:**\n\`\`\`${guildConfig.prefix} set criador.template Call do {name}\`\`\``
              );
              return;
            }

            await BotStorage.updateGuildConfig.template(
              this.message.guild?.id as string,
              newTemplate
            );

            await this.message.channel.send(
              `Template padrão do criador de call atualizado com sucesso, novo template:\n\`${newTemplate}\``
            );
          },
          ['prefix']: async () => {
            const newPrefix = this.args[1];

            await BotStorage.updateGuildPrefix(
              this.message.guild?.id as string,
              newPrefix
            );

            await this.message.channel.send(
              `**Prefixo do servidor atualizado com sucesso, novo prefixo: ${newPrefix}**`
            );
          },
          ['comandos']: () =>
            this.setTextChannelConfig.apply(this, [
              `${guildConfig.prefix} set comandos <ID DO CANAL DE COMANDOS>`,
              'Chat de comandos',
              (newCommandChannelId) =>
                BotStorage.updateGuildConfig.commandsChannelId(
                  this.message.guild?.id as string,
                  newCommandChannelId
                ),
              'text',
            ]),
          ['criador']: () =>
            this.setTextChannelConfig.apply(this, [
              `${guildConfig.prefix} set criador <ID DO CRIADOR DE CALL>`,
              'Chat de comandos',
              (newTriggerChannelId) =>
                BotStorage.updateGuildConfig.triggerChannelId(
                  this.message.guild?.id as string,
                  newTriggerChannelId
                ),
              'voice',
            ]),
          ['criador.categoria']: () =>
            this.setTextChannelConfig.apply(this, [
              `${guildConfig.prefix} set criador.categoria <ID DA CATEGORIA DO CRIADOR DE CALL>`,
              'Categoria do criador de call',
              (newTriggerChannelId) =>
                BotStorage.updateGuildConfig.parentCategoryId(
                  this.message.guild?.id as string,
                  newTriggerChannelId
                ),
              'category',
            ]),
          ['criador.privado']: async () => {
            const newValue = this.args[1] === 'habilitado';

            if (
              !this.args[1] ||
              !['habilitado', 'desabilitado'].includes(this.args[1])
            ) {
              await this.message.channel.send(
                `**Use um valor válido (habilitado ou desabilitado), exemplo:**\n\`\`\`${guildConfig.prefix} set criador.privado habilitado|desabilitado\`\`\``
              );
              return;
            }

            await BotStorage.updateGuildConfig.createPrivateChannels(
              this.message.guild?.id as string,
              newValue
            );

            await this.message.channel.send(
              newValue
                ? `**O criador de call foi configurado para criar calls _privadas_**`
                : `**O criador de call foi configurado para criar calls _públicas_**`
            );
          },
        };

        const targetCommand = mapCommand[secondaryCommand];

        if (!targetCommand) {
          this.message.channel.send(
            `**Você digitou um sub-comando inválido, use o comando abaixo para ver a lista completa de comandos:\n\`\`\`${guildConfig.prefix} help\`\`\`**`
          );

          return;
        }

        return await targetCommand.apply(this);
      } catch (err) {
        console.error(
          `Could not execute command Set. Error: ${(err as any).message}`
        );
      }
    }
  }

  async setTextChannelConfig(
    rightCommand: string,
    chatName: string,
    saveIt: (newId: string) => Promise<void>,
    type: 'text' | 'voice' | 'category' | 'news' | 'store',
    pron = 'o'
  ): Promise<void> {
    try {
      const guildId = this.message.guild?.id;

      if (!guildId) return;

      const newRuleChannel = this.args[1];

      const newRuleChannelId = newRuleChannel?.replace(/\D/g, '');

      if (!newRuleChannelId) {
        this.message.channel.send(
          `**O formato do comando está incorreto, é necessário usar neste formato**: \`\`\`\n${rightCommand}\`\`\``
        );

        return;
      }

      const newChannel = this.message.guild?.channels.cache.get(
        newRuleChannelId
      );

      if (!newChannel) {
        await this.message.channel.send(
          '**Você digitou o ID de um canal que não existe, verifique se está correto.** \n_Dica: você pode copiar o ID clicando com o botão direito em qualquer chat_'
        );

        return;
      }

      if (newChannel.type !== type) {
        await this.message.channel.send(
          `**Você digitou o ID de um canal que não é do tipo '${type}'.** \n_Somente canais do tipo '${type}' são suportados para ${pron} ${chatName.toLowerCase()}._`
        );

        return;
      }

      await saveIt(newRuleChannelId);

      await this.message.channel.send(
        `**${chatName} atualizad${pron} com sucesso, novo canal: <#${newRuleChannelId}>**`
      );
    } catch (err) {
      console.error(
        `Could not execute command Rules. Error: ${(err as any).message}`
      );
    }
  }

  canExecute(): boolean {
    return textChannelAdminCommandGuard(this.message, this.guildConfig);
  }
}
