// Translations. To add a language: copy the `en` block, translate the strings,
// add its code to `userConfig.language.options` in .claude-plugin/plugin.json.

export type Strings = {
  session: string
  week: string
  time: string
  hours: string
  used: (p: number) => string
  resets: (when: string) => string
  tokens: (input: string, cache: string, output: string) => string
  elapsed: (label: string, spent: string, total: number, p: number) => string
  left: (t: string) => string
  pace: (used: number, time: number) => string
}

export const LOCALES: Record<string, Strings> = {
  en: {
    session: 'Session',
    week: 'Week',
    time: 'time',
    hours: 'h',
    used: p => `used ${p}%`,
    resets: when => `resets ${when}`,
    tokens: (i, c, o) => `session tokens: ${i} in · ${c} cache · ${o} out`,
    elapsed: (label, spent, total, p) => `${label}, time: ${spent} of ${total} h elapsed (${p}%)`,
    left: t => `${t} left`,
    pace: (u, t) => `limit ${u}% at ${t}% of time`,
  },
  ru: {
    session: 'Сессия',
    week: 'Неделя',
    time: 'время',
    hours: 'ч',
    used: p => `использовано ${p}%`,
    resets: when => `сброс ${when}`,
    tokens: (i, c, o) => `токены сессии: ${i} вход · ${c} кеш · ${o} выход`,
    elapsed: (label, spent, total, p) => `${label}, время: прошло ${spent} из ${total} ч (${p}%)`,
    left: t => `осталось ${t}`,
    pace: (u, t) => `лимит ${u}% при ${t}% времени`,
  },
}

export const strings = (lang: unknown): Strings =>
  (typeof lang === 'string' && LOCALES[lang]) || LOCALES.en
