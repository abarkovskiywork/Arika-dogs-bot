export const COMMANDS_HELP_LIST = [
    { command: "add_service", description: "Добавить сервис" },
    { command: "update_service", description: "Обновить сервис" },
    { command: "list_services", description: "Список сервисов" },
    { command: "sync_services", description: "Синк с календарем" },

]

export const CALENDAR_COLORS = [
  { id: 1,  emoji: "🔵", label: "синий" },
  { id: 2,  emoji: "🟢", label: "зелёный" },
  { id: 3,  emoji: "🟣", label: "фиолетовый" },
  { id: 4,  emoji: "🔴", label: "красный" },
  { id: 5,  emoji: "🟡", label: "жёлтый" },
  { id: 6,  emoji: "🟠", label: "оранжевый" },
  { id: 7,  emoji: "🩵", label: "бирюзовый" },
  { id: 8,  emoji: "🩶", label: "серый" },
  { id: 9,  emoji: "💠", label: "голубой" },
  { id: 10, emoji: "🌲", label: "тёмно-зелёный" },
  { id: 11, emoji: "🍷", label: "тёмно-красный" },
] as const;