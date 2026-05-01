import { Bot } from "grammy";
import { registerMyIdCommand } from "./myid";
import { registerAddServiceCommand } from "./addServiceEvent";
import { registerStartCommand } from "./start";
import { registerDeleteServiceCommand } from "./deleteServiceEvent";
import { registerSyncServicesCommand } from "./syncServices";
import { registerListServicesCommand } from "./listServiceEvents"
import { registerUpdateServiceCommand } from "./updateServiceEvent"
import { CommandsRegistrar, EContext } from "../types";

const commands: CommandsRegistrar[] = [
    registerMyIdCommand,
    registerAddServiceCommand,
    registerStartCommand,
    registerDeleteServiceCommand,
    registerSyncServicesCommand,
    registerListServicesCommand,
    registerUpdateServiceCommand
]

export function registerCommands(bot: Bot<EContext>) {
    for (const register of commands) {
        register(bot)
    }
}