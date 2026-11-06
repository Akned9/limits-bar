# limits-bar

A Claude Code mod: two small bars above the prompt showing how much of your **session (5 h)** and **weekly** limits you've used, plus how much of each window's time has passed. Hover a bar to see a card with the exact %, reset time and the tokens spent in this session.

Languages: English, Русский. Pick one in the plugin's settings (`language`).

## Install

At the prompt of a terminal session:

```
/plugin install limits-bar --marketplace Akned9/limits-bar
```

From a shell:

```
claude plugin install limits-bar --marketplace Akned9/limits-bar
```

In the desktop app: click **+** next to the prompt box → **Plugins** → **Add marketplace** with `Akned9/limits-bar` → **Add plugin**.

## Add a language

1. In `hooks/i18n.ts` copy the `en` block, rename it to your language code (e.g. `de`) and translate the strings.
2. Add the code to `userConfig.language.options` in `.claude-plugin/plugin.json`.
3. Open a pull request.

---

# limits-bar (RU)

Мод для Claude Code: две полоски над полем ввода — сколько израсходовано лимита **сессии (5 ч)** и **недели**, и сколько прошло времени окна. Наведите на полоску — появится карточка с точным %, временем сброса и токенами сессии.

Язык выбирается в настройках плагина (`language`: `en` / `ru`). Установка — командами выше. Чтобы добавить язык — см. «Add a language».

## License

MIT
