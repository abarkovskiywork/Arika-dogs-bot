import { InlineKeyboard } from "grammy";
import { ServiceType, TrackingMode } from "@prisma/client";
import { conversations, type Conversation } from "@grammyjs/conversations";
import { getNeedsSetupServiceEvents, updateServiceEvent } from "../db/serviceEventData";
import { backfillWalkLogsForPastDays, upsertReminderWalkLog } from "../db/walkLogData";
import type { EContext } from "../types";
import { getBelgradeDateKey, toDayDate } from "../utils/utils";


type CleaningNoteConversation = Conversation<EContext, EContext>

export async function cleaningNoteConversation(conversation: CleaningNoteConversation, ctx: EContext): Promise<void> {

    const pending = ctx.session.cleaningNote;
    if (!pending) {
        await ctx.reply("Не найдено событие для комментария")
        return
    }



    const serviceEventId = pending.serviceId
    const today = toDayDate(getBelgradeDateKey());
    
    await ctx.reply("Сегодня была уборка?", {
        reply_markup: new InlineKeyboard()
            .text("Да ✅", "cleaning_done:1")
            .text("Нет ❌", "cleaning_done:0")
    })

    const answerCtx = await conversation.waitFor("callback_query:data")
    const data = answerCtx.callbackQuery.data

    if (!data.startsWith("cleaning_done:")) {
        await answerCtx.answerCallbackQuery("Нажми Да или Нет")
        return
    }

    await answerCtx.answerCallbackQuery();

    const walksCount = Number(data.split(":")[1])

    if (walksCount === 0) {
        await upsertReminderWalkLog({
            serviceEventId,
            date: today,
            walksCount: 0,
            note: null
        })

        ctx.session.cleaningNote = undefined
        await answerCtx.editMessageText("Записал: уборки не было")
        return
    }

    await answerCtx.editMessageText("Напиши комментарий к уборке")

    const noteCtx = await conversation.waitFor("message:text")
    const note = noteCtx.message.text.trim()

    await upsertReminderWalkLog({
        serviceEventId: serviceEventId,
        date: today,
        walksCount,
        note
    })

    ctx.session.cleaningNote = undefined
    await noteCtx.reply("Сохранил уборку")
    return
}