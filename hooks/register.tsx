import { atom, read, update } from 'claude-code'
import type { Register, SessionRateLimit } from 'claude-code'

import type { Tokens } from '../types'
import { strings } from './i18n'

const limits = atom({ plugin: 'limits-bar', key: 'limits' } as const, [] as SessionRateLimit[])
const tokens = atom({ plugin: 'limits-bar', key: 'tokens' } as const, { input: 0, cache: 0, output: 0 } as Tokens)
const now = atom({ plugin: 'limits-bar', key: 'now' } as const, 0)

const HOUR = 3_600_000

const WINDOWS = [
  { kind: 'five_hour', name: 'session', hours: 5 },
  { kind: 'seven_day', name: 'week', hours: 168 },
] as const

const WIDTH = 8

const bar = (percent: number) => {
  const filled = Math.max(0, Math.min(WIDTH, Math.round((percent / 100) * WIDTH)))
  return '█'.repeat(filled) + '░'.repeat(WIDTH - filled)
}

const colorOf = (percent: number) => (percent >= 90 ? 'red' : percent >= 70 ? 'yellow' : 'green')

const short = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)

const hoursText = (ms: number, unit: string) => {
  const h = ms / HOUR
  return h >= 10 ? `${Math.round(h)} ${unit}` : `${h.toFixed(1)} ${unit}`
}

const resetText = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const register: Register = (on, options) => {
  const L = strings(options.language)
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const usage = await $.session.usage()
    if (usage.rateLimits.length > 0) await update($, limits, () => usage.rateLimits)
    const tick = async () => {
      const t = await $.clock.now()
      await update($, now, () => t)
    }
    await tick()
    $.clock.every(60_000, tick)
    return result
  })

  on('session.measure', async ($, e, next) => {
    if (e.rateLimits.length > 0) await update($, limits, () => e.rateLimits)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const u = e.usage
    if (u) {
      await update($, tokens, t => ({
        input: t.input + u.input_tokens + u.cache_creation_input_tokens,
        cache: t.cache + u.cache_read_input_tokens,
        output: t.output + u.output_tokens,
      }))
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const all = await read($, limits)
    const shown = WINDOWS.flatMap(w => {
      const limit = all.find(l => l.kind === w.kind)
      return limit ? [{ ...w, limit }] : []
    })
    if (e.props.hasSurvey || shown.length === 0) return next(e)

    const t = await read($, tokens)
    const nowMs = (await read($, now)) || (await $.clock.now())
    const spent = L.tokens(short(t.input), short(t.cache), short(t.output))
    const { Box, Text } = $.ui.resolve(e)

    type Item = { key: string; label: string; percent: number; color: string; details: string[] }
    const groups: Item[][] = shown.map(({ kind, name, hours, limit }) => {
      const label = L[name]
      const resets = limit.resetsAt ? new Date(limit.resetsAt) : null
      const valid = resets && !Number.isNaN(resets.getTime()) ? resets : null
      const usage: Item = {
        key: kind,
        label,
        percent: limit.percentUsed,
        color: colorOf(limit.percentUsed),
        details: [`${label}: ${L.used(limit.percentUsed)}`, ...(valid ? [L.resets(resetText(valid))] : []), spent],
      }
      if (!valid) return [usage]

      const windowMs = hours * HOUR
      const left = Math.max(0, Math.min(windowMs, valid.getTime() - nowMs))
      const elapsed = windowMs - left
      const timePercent = Math.round((elapsed / windowMs) * 100)
      const time: Item = {
        key: `${kind}-time`,
        label: L.time,
        percent: timePercent,
        color: 'cyan',
        details: [L.elapsed(label, hoursText(elapsed, L.hours), hours, timePercent), L.left(hoursText(left, L.hours)), L.pace(limit.percentUsed, timePercent)],
      }
      return [usage, time]
    })

    // Tooltip: a bordered card drawn absolutely over the rows above the bars (moves nothing).
    const itemWidth = (it: Item) => it.label.length + 1 + WIDTH
    const groupWidth = (group: Item[]) =>
      4 + group.reduce((sum, it, i) => sum + itemWidth(it) + (i === 0 ? 0 : 2), 0)

    let groupX = 0
    const frames = groups.map((group, g) => {
      groupX += g === 0 ? 0 : 1
      let itemX = groupX + 2
      const frame = (
        <Box key={`group-${g}`} flexDirection="row" borderStyle="round" borderDimColor paddingX={1} marginLeft={g === 0 ? 0 : 1}>
          {group.map((it, i) => {
            itemX += i === 0 ? 0 : 2
            const x = itemX
            itemX += itemWidth(it)
            return (
              <Box key={it.key} flexDirection="row" marginLeft={i === 0 ? 0 : 2}>
                <Text dimColor>{it.label} </Text>
                <Text color={it.color}>{bar(it.percent)}</Text>
                <Box
                  position="absolute"
                  top={-(it.details.length + 3)}
                  left={-x}
                  width={Math.max(...it.details.map(l => l.length)) + 4}
                  flexDirection="column"
                  borderStyle="round"
                  paddingX={1}
                  display="none"
                  hover={{ display: 'flex' }}
                >
                  {it.details.map((line, j) => (
                    <Text key={`l${j}`} wrap="wrap">{line}</Text>
                  ))}
                </Box>
              </Box>
            )
          })}
        </Box>
      )
      groupX += groupWidth(group)
      return frame
    })

    return (
      <Box flexDirection="row">{frames}</Box>
    )
  })
}
