import { ConversationFlavor } from "@grammyjs/conversations";
import { Context, Bot } from "grammy";


export type EContext = ConversationFlavor<Context>
export type CommandsRegistrar = (bot: Bot<EContext>) => void