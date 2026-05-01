import { type Bot, Composer } from "grammy";
import { adminOnly } from "../middlewares/adminOnly";
import { registerMyIdCommand } from "./myid";
import { registerAddServiceCommand } from "./addServiceEvent";
import { registerStartCommand } from "./start";
import { registerDeleteServiceCommand } from "./deleteServiceEvent";
import { registerSyncServicesCommand } from "./syncServices";
import { registerListServicesCommand } from "./listServiceEvents"
import { registerUpdateServiceCommand } from "./updateServiceEvent"
import { registerCountPriceCommand } from "./countPrice"
import { registerIncomeReportCommand } from "./incomeReport"
import { CommandsRegistrar, EContext } from "../types";

const adminCommands: CommandsRegistrar[] = [
    registerAddServiceCommand,
    registerDeleteServiceCommand,
    registerSyncServicesCommand,
    registerListServicesCommand,
    registerUpdateServiceCommand,
    registerCountPriceCommand,
    registerIncomeReportCommand
]

const publicCommands: CommandsRegistrar[] = [
    registerStartCommand,
    registerMyIdCommand
]

export function registerCommands(bot: Bot<EContext>) {
    const adminComposer = new Composer<EContext>();
    const publicComposer = new Composer<EContext>();

    for (const register of publicCommands) {
        register(publicComposer)
    }

    adminComposer.use(adminOnly);

    for (const register of adminCommands) {
        register(adminComposer)
    }
    
    bot.use(publicComposer)
    bot.use(adminComposer)
}