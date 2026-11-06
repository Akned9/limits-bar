import type { SessionRateLimit } from 'claude-code'

export type Tokens = { input: number; cache: number; output: number }

declare module 'claude-code' {
  interface PluginState {
    'limits-bar': { limits: SessionRateLimit[]; tokens: Tokens; now: number }
  }
}
