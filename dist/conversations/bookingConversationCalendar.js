"use strict";
const { InlineKeyboard } = require("grammy");
function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}
function addMonths(date, count) {
    return new Date(date.getFullYear(), date.getMonth() + count, 1);
}
function formatMonthTitle(date) {
    return date.toLocaleDateString("ru-RU", {
        month: "long",
        year: "numeric",
    });
}
function toYmd(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y} -${m} -${d}`;
}
function parseYmd(ymd) {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d);
}
function isSameDay(a, b) {
    return toYmd(a) === toYmd(b);
}
function isBetweenInclusive(date, from, to) {
    const t = parseYmd(toYmd(date)).getTime();
    return t >= parseYmd(toYmd(from)).getTime() && t <= parseYmd(toYmd(to)).getTime();
}
function buildCalendarKeyboard({ currentMonth, selectedFrom, selectedTo, blockedDates = new Set(), // сюда потом передашь занятые даты: "2026-04-18"
 }) {
    const keyboard = new InlineKeyboard();
    keyboard
        .text("◀️", `book:nav:${toYmd(addMonths(currentMonth, -1))}`)
        .text(formatMonthTitle(currentMonth), "book:noop")
        .text("▶️", `book:nav:${toYmd(addMonths(currentMonth, 1))}`)
        .row();
    const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    for (const day of weekdays) {
        keyboard.text(day, "book:noop");
    }
    keyboard.row();
    const firstDay = startOfMonth(currentMonth);
    const year = firstDay.getFullYear();
    const month = firstDay.getMonth();
    const jsDay = firstDay.getDay(); // 0=Sun ... 6=Sat
    const offset = jsDay === 0 ? 6 : jsDay - 1; // monday-first
    for (let i = 0; i < offset; i++) {
        keyboard.text(" ", "book:noop");
    }
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let col = offset;
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const ymd = toYmd(date);
        const isBlocked = blockedDates.has(ymd);
        let label = String(day);
        let cb = `book: pick: ${ymd}`;
        if (isBlocked) {
            label = `🚫${day}`;
            cb = `book: blocked:${ymd}`;
        }
        else if (selectedFrom && isSameDay(date, selectedFrom)) {
            label = `🟢${day}`;
        }
        else if (selectedTo && isSameDay(date, selectedTo)) {
            label = `🔵${day}`;
        }
        else if (selectedFrom && selectedTo && isBetweenInclusive(date, selectedFrom, selectedTo)) {
            label = `·${day}`;
        }
        keyboard.text(label, cb);
        col++;
        if (col === 7) {
            keyboard.row();
            col = 0;
        }
    }
    if (col !== 0) {
        for (let i = col; i < 7; i++) {
            keyboard.text(" ", "book:noop");
        }
        keyboard.row();
    }
    keyboard
        .text("Сбросить", "book:reset")
        .text("OK", "book:ok")
        .row()
        .text("Отмена", "book:cancel");
    return keyboard;
}
function buildCaption(selectedFrom, selectedTo) {
    if (!selectedFrom) {
        return "Выбери дату начала.";
    }
    if (!selectedTo) {
        return `Начало: ${toYmd(selectedFrom)} \nТеперь выбери дату конца.`;
    }
    return `Диапазон: \n${toYmd(selectedFrom)} → ${toYmd(selectedTo)} \nНажми OK.`;
}
async function bookingConversationCalendar(conversation, ctx) {
    let currentMonth = startOfMonth(new Date());
    let selectedFrom = null;
    let selectedTo = null;
    // Заглушка: позже сюда подставим реальные занятые даты из БД
    let blockedDates = new Set();
    const sent = await ctx.reply(buildCaption(selectedFrom, selectedTo), {
        reply_markup: buildCalendarKeyboard({
            currentMonth,
            selectedFrom,
            selectedTo,
            blockedDates,
        }),
    });
    while (true) {
        const cbCtx = await conversation.waitFor("callback_query:data");
        const data = cbCtx.callbackQuery.data;
        await cbCtx.answerCallbackQuery();
        if (!data.startsWith("book:"))
            continue;
        if (data === "book:noop") {
            continue;
        }
        if (data === "book:cancel") {
            await cbCtx.editMessageText("Выбор отменён.");
            return;
        }
        if (data === "book:reset") {
            selectedFrom = null;
            selectedTo = null;
            await cbCtx.editMessageText(buildCaption(selectedFrom, selectedTo), {
                reply_markup: buildCalendarKeyboard({
                    currentMonth,
                    selectedFrom,
                    selectedTo,
                    blockedDates,
                }),
            });
            continue;
        }
        if (data.startsWith("book:nav:")) {
            const ymd = data.replace("book:nav:", "");
            currentMonth = startOfMonth(parseYmd(ymd));
            // потом здесь подгружай blockedDates для этого месяца
            blockedDates = new Set();
            await cbCtx.editMessageText(buildCaption(selectedFrom, selectedTo), {
                reply_markup: buildCalendarKeyboard({
                    currentMonth,
                    selectedFrom,
                    selectedTo,
                    blockedDates,
                }),
            });
            continue;
        }
        if (data.startsWith("book:blocked:")) {
            await cbCtx.answerCallbackQuery({
                text: "Эта дата недоступна",
                show_alert: true,
            });
            continue;
        }
        if (data.startsWith("book:pick:")) {
            const ymd = data.replace("book:pick:", "");
            const picked = parseYmd(ymd);
            if (!selectedFrom || (selectedFrom && selectedTo)) {
                selectedFrom = picked;
                selectedTo = null;
            }
            else {
                if (picked.getTime() < selectedFrom.getTime()) {
                    selectedTo = selectedFrom;
                    selectedFrom = picked;
                }
                else {
                    selectedTo = picked;
                }
            }
            await cbCtx.editMessageText(buildCaption(selectedFrom, selectedTo), {
                reply_markup: buildCalendarKeyboard({
                    currentMonth,
                    selectedFrom,
                    selectedTo,
                    blockedDates,
                }),
            });
            continue;
        }
        if (data === "book:ok") {
            if (!selectedFrom || !selectedTo) {
                await cbCtx.answerCallbackQuery({
                    text: "Сначала выбери диапазон дат",
                    show_alert: true,
                });
                continue;
            }
            await cbCtx.editMessageText(`Выбран диапазон: \n${toYmd(selectedFrom)} → ${toYmd(selectedTo)}`);
            // вот тут потом:
            // 1) спросишь услугу или уже заранее будешь знать что это boarding
            // 2) создашь booking в БД
            // 3) отправишь Саше/пользователю уведомление
            return;
        }
    }
}
module.exports = bookingConversationCalendar;
