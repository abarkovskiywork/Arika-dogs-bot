import { type Bot, Composer } from "grammy";
import { adminOnly } from "../middlewares/adminOnly";
import { managerRole } from "../middlewares/managerRole";
import { registerMyIdCommand } from "./manager/myid";
import { registerAddServiceCommand } from "./manager/addServiceEvent";
import { registerStartCommand } from "./start";
import { registerDeleteServiceCommand } from "./manager/deleteServiceEvent";
import { registerSyncServicesCommand } from "./admin/syncServices";
import { registerAdminListServicesCommand } from "./admin/adminListServices";
import { registerAdminDeleteServiceCommand } from "./admin/adminDeleteService";
import { registerListServicesCommand } from "./manager/listServiceEvents"
import { registerUpdateServiceCommand } from "./manager/updateServiceEvent"
import { registerCountPriceCommand } from "./manager/countPrice"
import { registerIncomeReportCommand } from "./manager/incomeReport"
import { registerCheckCommand } from "./manager/checkServices"
import { registerSetupServicesCommand } from "./manager/setupServices"
import { registerSetDigestTimeCommand } from "./manager/setDigestTime"
import { registerSetReminderTimeCommand } from "./manager/setReminderTime"
import { registerDigestCommand } from "./manager/digest"
import { registerSendReminderCommand } from "./manager/sendReminder"
import { CommandsRegistrar, EContext } from "../types";
import { registerAdminTestTime } from "./admin/adminTestTIme";

const adminCommands: CommandsRegistrar[] = [
    registerSyncServicesCommand,
    registerAdminListServicesCommand,
    registerAdminDeleteServiceCommand,
    registerAdminTestTime,
];

const managerCommands: CommandsRegistrar[] = [
    //registerAddServiceCommand,
    registerDeleteServiceCommand,
    registerListServicesCommand,
    registerUpdateServiceCommand,
    registerCountPriceCommand,
    registerIncomeReportCommand,
    registerCheckCommand,
    registerSetupServicesCommand,
    registerSetDigestTimeCommand,
    registerSetReminderTimeCommand,
    registerDigestCommand,
    registerSendReminderCommand,
];

const publicCommands: CommandsRegistrar[] = [
    registerStartCommand,
    registerMyIdCommand,
];

export function registerCommands(bot: Bot<EContext>) {
    const adminComposer = new Composer<EContext>();
    const managerComposer = new Composer<EContext>();
    const publicComposer = new Composer<EContext>();

    for (const register of publicCommands) {
        register(publicComposer);
    }

    adminComposer.use(adminOnly);
    for (const register of adminCommands) {
        register(adminComposer);
    }

    managerComposer.use(managerRole);
    for (const register of managerCommands) {
        register(managerComposer);
    }

    bot.use(publicComposer);
    bot.use(adminComposer);
    bot.use(managerComposer);
}
