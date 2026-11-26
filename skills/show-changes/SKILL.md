---
name: show-changes
description: Show a person what you changed in a web app by laying numbered frames and a legend over the live page in their browser, following the parts as the page scrolls and updates. Use after a large UI change (many places changed, or a flow across screens), when the person should see the changes on the screen rather than read a written report. Needs a browser tool that can run JavaScript in the page (Chrome DevTools MCP, Playwright MCP, Claude in Chrome). Not for annotating static screenshot files.
---

# Show changes on the live screen

When many places changed, a person cannot check them one by one from a written report. Put the
app in the state where the changes are visible, lay a numbered frame on each changed part, and
report one line per number. The marks are one transparent layer over the page: clicks pass
through, the page's own code never sees them, and a reload removes them.

Aim to finish in a few minutes. Spend the time on the screen, not on reading the whole code.
Everything you need is in this file and `scripts/show-marks.js`; do not list the skill's folder.

## When

- After a large change: several screens or parts changed, or a flow (decide → run → stop) that
  the person should watch.
- Best right after you made the change, in the same conversation: you know what changed and
  where it shows. Asked later, or about changes you did not make, you have to find them first,
  which takes much longer.
- Not for a small change (one word, one color): say it in words.

## What you need

A browser tool that runs JavaScript in the person's page:

| Tool | How to run the script |
|---|---|
| Chrome DevTools MCP | `evaluate_script` with `sourcePath` = the absolute path of `scripts/show-marks.js` and `format: "script"`. Try this first, without reading the file. Only if it is refused (the folder is outside the server's `--filesystemRoot`), read the file and pass its text as `function: "() => { … }"` |
| Playwright MCP | `browser_evaluate` with the file's text wrapped in a function |
| Claude in Chrome | `javascript_tool` with the file's text |

Load the script once. `showMarks` and `clearMarks` stay in the page until it reloads; after a
reload, load it again. The script goes into the page only: never copy it, or anything else, into
the project to show the changes.

Use the person's own browser session where they will look (a debug Chrome they opened, the tab
they have). A headless browser the person cannot see defeats the purpose.

## Steps

1. **List the changes you made as things a person sees**: a word, a button, a row, a badge, a
   box. One line each: the words on the screen, and the screen they are on. A change with no
   screen (database, server, prompts, logs) is said in words, not marked. (Changes you did not
   make: read the `+` lines of the UI text in their diff first.)
2. **Get the screen in the state you checked it in** while making the change: the same data,
   the same view.
   - Use a copy of the data, not the real records. If the person is working in that tab, read
     the screen first and do not take over what they are doing.
   - Write nothing into the project to show the changes: no files, no commits, no settings.
   - Do not start anything that costs money or takes long (AI runs, training, sending) to make a
     state. Mark what you can and report the rest as not shown.
3. **Bring the tab to the front** (Chrome DevTools MCP: `select_page` with `bringToFront`).
4. **Load the script** (above).
5. **Mark each change**, one target per change, numbered in the order you will report:

   ```js
   () => showMarks([
     { text: "^Stop trial \\d+$", selector: "button", label: "① Stopping a trial is now a decision" },
     { text: "^Planned end$", label: "② The chart runs to the planned end" },
     { text: "^\\d+ unread$", selector: "nav *", label: "③ The unread count is in the side bar now" },
     { text: "^Export as CSV$", selector: "[role=menu] *", label: "④ Open the ⋯ menu: exporting moved here" },
   ], { lang: "en" })
   ```

   - Name a part by the words it shows: `text` is a RegExp source. Anchor it with `^…$`, write
     numbers as `\\d+`, and escape `( ) [ ] . ? + *`. The smallest parts saying it are marked,
     not those around them.
   - Add `selector` (CSS) only to narrow: a tag, a role, an `aria-label`, a `data-*` attribute.
     Never class names made by a CSS framework; they change.
   - Start each `label` with its number (①, ②, … or 1., 2., …) and say what changed for the
     person, not how it is built. The number sits on the frame's corner and the words go to the
     legend, so the marks never hide what they point at.
   - It returns `found` (the parts that match) and `shown` (those framed now) for each target:
     - `found` 0 means that state is not on the screen: other words, or another screen or state.
     - `found` above 1 for one change: narrow it with `selector`, or `pick: "first"` when it is
       the same thing repeated (a row of cards).
     - `shown` 0 with `found` above 0: scrolled away, or covered by a dialog or a menu. Parts
       under something else get no frame.
   - A part that shows only in another state (a box opened by a button, a hover, a tab) goes in
     the same call; its label says how to get there. Its frame comes when the person opens it.
   - Fix a target and call again: the call replaces the marks. Trust the counts; do not take a
     screenshot after every call.
   - To show a part that needs a click, do the click, the wait and the marks in one evaluated
     function, and return the counts:
     `async () => { document.querySelector("…").click(); await new Promise((r) => setTimeout(r, 500)); return showMarks([…]); }`
   - Options: `lang` (`"en"` or `"ja"`: the note shown with the marks), `note` (your own note in
     the person's language), `tags` (`true`: each label beside its frame), `color`, `corner`
     (where the legend sits; move it when it covers a marked part), `every` (ms between
     measurements, 300 by default).
6. **Look once**: one screenshot, half a second after your last click, to see that each frame
   sits on the part you mean. The same words often appear elsewhere.
7. **Report**, short:
   - First say that the frames only show what changed and are not part of the app (people take
     them for a new feature otherwise).
   - One line per number: what changed there.
   - What the person can press to try it, by its number, and what they should not press.
   - What you could not show on the screen, said as not checked, with the reason.
8. Leave the marks while the person looks. `clearMarks()` or a reload removes them.

## Limits

- Parts in closed shadow roots, in iframes of another origin, or drawn inside a canvas cannot be
  found (open shadow roots are searched).
- A part inside a canvas or a chart drawn as one image can only be marked as a whole.
- A part counts as covered when something else is on top at the middle of its visible part.
- The marks follow the page by measuring it every `every` ms; very fast animations may lag.

## Japanese example / 日本語の例

```js
() => showMarks([
  { text: "^試行 \\d+ を止める$", selector: "button", label: "① 押すと「試行を止める」決定になる" },
  { text: "^予定の終わり$", label: "② 図の横は、予定の終わりまで" },
  { text: "^CSV で書き出す$", selector: "[role=menu] *", label: "③ ⋯ のメニューを開くと出る: 書き出しはここに移った" },
], { lang: "ja" })
```

報告は「桃色の枠は、変えた所を見せるための印で、アプリの一部ではありません」と先に言い、番号ごとに一言で。
