import { ConversationFlavor } from "@grammyjs/conversations";
import { Context, Composer, SessionFlavor } from "grammy";

export type SessionData = {
    cleaningNote?: {
        serviceId: number
        dateKey?: string
    }
}
export type EContext = Context & SessionFlavor<SessionData> & ConversationFlavor<Context>
export type CommandsRegistrar = (composer: Composer<EContext>) => void
