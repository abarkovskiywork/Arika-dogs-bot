const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { getCheckDate } = require("../dist/utils/checkDate");
const { buildWalkReportLines } = require("../dist/utils/walkReport");

const day = (date) => new Date(`${date}T00:00:00.000Z`);
const oldMessage = { callbackQuery: { message: { date: day("2026-09-11").getTime() / 1000 } } };
assert.equal(getCheckDate(oldMessage), "2026-09-11");
assert.equal(getCheckDate(oldMessage, "2026-09-10"), "2026-09-10");
assert.throws(() => getCheckDate({}));
assert.deepEqual(buildWalkReportLines({
  logs: [{ date: day("2026-09-11"), walksCount: 0 }, { date: new Date("2026-09-13T20:50:00Z"), walksCount: 1 }],
  startDate: "2026-09-01", endDate: "2026-09-30",
  serviceStart: day("2026-09-11"), serviceEnd: day("2026-09-30"), today: "2026-09-13",
}), ["11-09 - 0", "12-09 - нет отметки", "13-09 - 1"]);
assert.deepEqual(buildWalkReportLines({
  logs: [], startDate: "2026-09-01", endDate: "2026-09-30",
  serviceStart: day("2026-10-01"), serviceEnd: day("2026-10-31"), today: "2026-09-13",
}), []);

class Keyboard {
  buttons = [];
  text(label, data) { this.buttons.push({ label, data }); return this; }
  row() { return this; }
}

async function testReminder() {
  const writes = [];
  const queries = [];
  const exports = {};
  const service = { id: 2, dogName: "Mike", serviceType: "walk", walksPerDay: 2, walkLogs: [] };
  vm.runInNewContext(fs.readFileSync(require.resolve("../dist/handlers/reminderCheckActions"), "utf8"), {
    exports,
    require(id) {
      if (id === "grammy") return { InlineKeyboard: Keyboard };
      if (id === "@prisma/client") return { ServiceType: { walk: "walk", cleaning: "cleaning" } };
      if (id.includes("serviceEventData")) return {
        getServiceEventById: async () => service,
        getAskDailyServiceEventsForDate: async (date) => { queries.push(date); return [{ ...service, walkLogs: writes }]; },
      };
      if (id.includes("walkLogData")) return { upsertReminderWalkLog: async (data) => writes.push(data) };
      if (id.includes("checkDate")) return { getCheckDate };
      if (id.includes("utils/utils")) return { getBelgradeDateKey: () => "2026-09-13", isManager: () => true, toDayDate: day };
      return {};
    },
  });
  const handlers = [];
  exports.registerReminderCheckActions({ callbackQuery: (pattern, handler) => handlers.push({ pattern, handler }) });
  let message;
  async function click(data) {
    const { pattern, handler } = handlers.find(({ pattern }) => pattern.test(data));
    await handler({ ...oldMessage, from: { id: 1 }, match: data.match(pattern),
      answerCallbackQuery: async () => {}, editMessageText: async (text, options) => { message = { text, ...options }; },
    });
  }
  const reminder = exports.buildReminderContent([service], "2026-09-11");
  assert.equal(reminder.keyboard.buttons[0].data, "rem_s:2:2026-09-11");
  await click(reminder.keyboard.buttons[0].data);
  assert.equal(message.reply_markup.buttons[1].data, "rem_w:2:1:2026-09-11");
  await click(message.reply_markup.buttons[1].data);
  assert.equal(writes[0].date.toISOString(), "2026-09-11T00:00:00.000Z");
  assert.deepEqual(queries, ["2026-09-11"]);
  assert.match(message.text, /2026-09-11/);
  await click("rem_w:2:0");
  assert.equal(writes[1].date.toISOString(), "2026-09-11T00:00:00.000Z");
  assert.equal(writes[1].walksCount, 0);
}

testReminder().then(() => console.log("Dated reminder and report checks passed")).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
