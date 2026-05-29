export const COMMANDS_HELP_LIST = [
   // { command: "add_service", description: "Добавить услугу" },
    { command: "update_service", description: "Обновить услугу" },
    { command: "list_services", description: "Список услуг" },
    { command: "delete_service", description: "Удалить услугу" },
    { command: "income_report", description: "Отчет по доходам" },
    { command: "count_price", description: "Подсчитать стоимость" },
    { command: "check", description: "Отметить прогулки за сегодня" },
    { command: "setup_services", description: "Настроить новые события" },
    { command: "set_digest_time", description: "Установить время ежедневного дайджеста" },
    { command: "set_reminder_time", description: "Установить время напоминания о прогулках" },
    { command: "digest", description: "Показать дайджест на сегодня" },
    { command: "reminder", description: "Отправить напоминание о прогулках" },
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

export const CLEANING_DURATIONS = [
  { label: "0 мин",   minutes: 0 },
  { label: "15 мин",  minutes: 15 },
  { label: "30 мин",  minutes: 30 },
  { label: "1 час",   minutes: 60 },
  { label: "1.5 ч",   minutes: 90 },
  { label: "2 часа",  minutes: 120 },
] as const;