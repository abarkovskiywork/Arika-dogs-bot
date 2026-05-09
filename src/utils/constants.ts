export const COMMANDS_HELP_LIST = [
    { command: "add_service", description: "Добавить услугу" },
    { command: "update_service", description: "Обновить услугу" },
    { command: "list_services", description: "Список услуг" },
    { command: "delete_service", description: "Удалить услугу" },
    { command: "income_report", description: "Отчет по доходам" },
    { command: "count_price", description: "Подсчитать стоимость" },
    { command: "check", description: "Отметить прогулки за сегодня" },
    { command: "setup_services", description: "Настроить новые события" },
    { command: "set_digest_time", description: "Установить время ежедневного дайджеста" },
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

export const SERVICE_TYPES = ["walk", "boarding", "home_visit"] as const;
export const TRACKING_MODES = ["auto_done", "ask_daily"] as const;
