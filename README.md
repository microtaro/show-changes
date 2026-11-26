<h1 align="center">show-changes</h1>

<p align="center">
  <strong>After a big change to a web app, show the person every change on the live screen: a numbered frame on each changed part and one legend, laid over the page they are looking at.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-3730a3" alt="License: Apache-2.0"></a>
  <img src="https://img.shields.io/badge/agent%20skill-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-3730a3" alt="An agent skill for Claude Code, Codex and Cursor">
  <img src="https://img.shields.io/badge/browser-Chrome%20DevTools%20MCP-3730a3" alt="Uses Chrome DevTools MCP">
  <img src="https://img.shields.io/badge/marks-English%20%7C%20%E6%97%A5%E6%9C%AC%E8%AA%9E-3730a3" alt="English and Japanese">
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#demo">Demo</a> ·
  <a href="#what-it-does">What it does</a> ·
  <a href="#use-it">Use it</a> ·
  <a href="#options">Options</a> ·
  <a href="#good-to-know">Good to know</a> ·
  <a href="CHANGELOG.md">Changelog</a> ·
  <a href="README.ja.md">日本語</a>
</p>

When an agent changes many places, a written report leaves the person to find each one on the
screen. With this skill the agent opens the app in the state where the changes show and marks
them right there: ① ② ③ on the parts, the words in a legend. The person checks every change at
a glance and presses what they want to try.

Use it during development: ask the agent that made the change, right after it, in the same
conversation. In our test that took under a minute. Asked later, or of an agent that did not make
the change, it took about ten minutes, because the agent first had to find the changes
([Use it](#use-it)).

## Demo

The skill on another app's plan screen. The marks come; when "Show all" opens the folded text,
frame ② grows with it; scrolling up brings frame ④ into view.

![Numbered frames laid over a live page; frame 2 grows when the folded text opens, and frame 4 comes into view on scrolling up.](docs/demo-en.gif)

[Download it as a video (mp4)](docs/demo-en.mp4?raw=true)

## What it does

**1. The screen as it is.** The agent brings the app to the state where the changes show (a run
going, a proposal waiting, a section open) and brings the tab to the front.

![The plan screen of an annotation app, nothing marked.](docs/images/step-1.en.jpg)

**2. A frame on each change.** A number sits on each frame's corner; the words are listed in one
legend, so the marks never hide what they point at. The legend says the frames are not part of
the app.

![Three parts framed and numbered 1 to 3, with a legend of four at the bottom right: the fourth is above, off the screen.](docs/images/step-2.en.jpg)

**3. The marks follow the page.** The parts are measured again every 0.3 s, so the frames follow
what scrolls, opens or grows. Clicks pass through them: the person can press anything under a
frame.

![After "Show all" and scrolling up: frame 2 holds the opened text, and frame 4 on a label description came into view.](docs/images/step-3.en.jpg)

How it is built:

- One transparent layer on top of the page. The page's own code never sees it, nothing is
  written anywhere, and a reload removes it.
- Each mark names its part by a CSS selector and/or the words in it, so the same call works
  after the page re-renders.
- It returns, for each mark, how many parts it found and how many are framed now. A part under
  a dialog or a menu gets no frame. 0 found means that state is not on the screen yet, and the
  skill tells the agent to say so instead of reporting it.
- Open shadow roots are searched too.

## Install

You need an agent that runs skills (Claude Code, Codex or Cursor) and a browser tool it can use
to run JavaScript in your page. The steps below use Chrome DevTools MCP.

### 1. Install the skill

```bash
# Claude Code
npx skills add microtaro/show-changes --skill show-changes --agent claude-code --global
# Codex
npx skills add microtaro/show-changes --skill show-changes --agent codex --global
# Cursor
npx skills add microtaro/show-changes --skill show-changes --agent cursor --global
```

`--global` keeps the skill out of your projects: nothing is added to their files.

### 2. Give your agent a browser

[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) lets the agent run
JavaScript in a Chrome tab. It needs Node.js (LTS) and Chrome.

```bash
# Claude Code
claude mcp add chrome-devtools --scope user -- npx chrome-devtools-mcp@latest --filesystemRoot ~/.agents/skills
# Codex
codex mcp add chrome-devtools -- npx chrome-devtools-mcp@latest --filesystemRoot ~/.agents/skills
```

Cursor: Settings → MCP → New MCP Server, with `"command": "npx"` and
`"args": ["-y", "chrome-devtools-mcp@latest", "--filesystemRoot", "/home/you/.agents/skills"]`
(your home's full path).

`--filesystemRoot` lets the server read the skill's script from `~/.agents/skills`, where
`npx skills add --global` keeps skills (the agents' own skill folders link there). Without it the
agent copies the script's text into the call; that copying alone took 17 seconds in our test.

### 3. Mark the Chrome you look at

By default the MCP server starts a Chrome of its own. To mark the window you are looking at,
start Chrome with a debugging port and a separate profile, and point the server at it with
`--browser-url`:

```bash
# Start Chrome (Linux example; close other Chrome windows first)
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-profile-show-changes
```

```json
"args": ["chrome-devtools-mcp@latest", "--browser-url=http://127.0.0.1:9222", "--filesystemRoot", "/home/you/.agents/skills"]
```

The open port lets any program on your computer control that Chrome, so use a separate profile
and close it when you are done. On WSL, start Chrome on the Windows side the same way and point
`--browser-url` at it.

Playwright MCP and Claude in Chrome work too, as long as the browser is one you can see: the
skill only needs to run JavaScript in the page.

## Use it

Right after a change, in the same conversation, ask your agent:

```text
Show me on the screen what you changed.
```

Ask then: the agent knows what it changed and on which screen it shows. Asked in a new
conversation, or about changes another agent made, it first has to find them in the diff and the
code. In our test (Claude Opus 5.5):

| Who shows the change | Time | Tool calls |
|---|---|---|
| The agent that just made it, in the same conversation (two screens) | 48–60 seconds | 10–12 |
| A new agent, four commits in an app it had never seen | about 10 minutes | 90 |

Nothing is written into your project: no files, no commits, no settings. The script goes into the
page only, and a reload removes it.

The agent puts the app in that state, loads `scripts/show-marks.js` into the page and marks the
changes:

```js
showMarks([
  { text: "^Words to the worker AI", label: "① Shown in full, not folded" },
  { selector: "details", text: "^Fixed rules", label: "② A long text is folded" },
  { text: "^Show all$", label: "③ \"Show all\" opens the folded text" },
], { lang: "en" })
```

Then it reports one line per number, says the frames are not part of the app, and tells you what
you can press. `clearMarks()` or a reload removes the marks.

## Options

| Mark | |
|---|---|
| `selector` | A CSS selector. Default: any element |
| `text` | A regular expression the part's text must match. The smallest parts saying it are marked, not those around them |
| `pick` | `"all"` (default), `"first"` or `"last"` |
| `label` | The words, starting with the mark's number (`① …`) |

| Option | |
|---|---|
| `lang` | `"en"` (default) or `"ja"`: the note said with the marks |
| `note` | Your own note instead |
| `tags` | `true`: each label beside its frame instead of in the legend |
| `color` | The frames' color. Default `#d0198c` |
| `corner` | Where the legend sits: `"bottom-right"` (default), `"bottom-left"`, `"top-right"`, `"top-left"` |
| `every` | Milliseconds between measurements. Default 300 |

It returns `{ label, found, shown }` for each mark: `found` is the parts that match, `shown` those
framed now (inside the window and not covered by anything on top).

## Good to know

- **Loading the script with Chrome DevTools MCP:** `evaluate_script` can read the script from a
  file (`sourcePath`) only inside the folders the server may use: your project, the temp folder,
  or one added with `--filesystemRoot` (step 2 of Install). Otherwise the agent passes the
  script's text itself, which is slower.
- **Recording:** Chrome DevTools MCP's `screencast_start` records the tab as mp4 (its path has the
  same limit). The demo above was made that way.
- **Not for screenshot files:** this marks a live page. To draw on an image file, use an image
  annotation tool.

## Limits

- Parts in closed shadow roots, in iframes of another origin, or drawn inside a canvas cannot be
  found.
- A chart drawn as one canvas or image can only be framed as a whole.
- A part counts as covered when something else is on top at the middle of its visible part.
- Very fast animations may lag behind the frames by up to `every` ms.

## Your page and safety

The script runs only in the tab the agent marks. It sends nothing over the network, stores
nothing, and changes nothing of the page but its own layer. The browser's debugging port is the
part to be careful with (step 3 above).

## Develop

```bash
node --test tests/*.test.mjs
```

## License

Apache-2.0. See [LICENSE](LICENSE).
