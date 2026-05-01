import { ConversationFlavor } from "@grammyjs/conversations";
import { Context, Composer } from "grammy";


export type EContext = ConversationFlavor<Context>
export type CommandsRegistrar = (composer: Composer<EContext>) => void