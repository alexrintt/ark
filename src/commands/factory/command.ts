export enum CommandType {
  ping,
  say,
  set,
  config,
}

export abstract class Command {
  abstract execute(): Promise<void>;
  abstract canExecute(): boolean;
}
