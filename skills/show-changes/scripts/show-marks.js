// show-marks: numbered frames and a legend laid over a live web page, to show a person what
// changed. Run this file in the page (any browser tool that can evaluate JavaScript in it), then:
//
//   showMarks([
//     { selector: "button", text: "^Stop trial \\d+$", label: "① Stopping is now a decision" },
//     { text: "Planned end", pick: "first", label: "② The chart runs to the planned end" },
//   ], { lang: "en" })
//
// A target: selector (CSS; default: any element), text (a RegExp source the part's text must
// match; the smallest parts saying it are marked, not those around them), pick ("all" by
// default, "first" or "last"), label (the words, starting with the mark's number).
// Options: lang ("en" or "ja": the note said with the marks), note (your own note instead),
// tags (true: each label beside its frame instead of in the legend), color, corner (where the
// legend sits: "bottom-right" by default, "bottom-left", "top-right", "top-left"), every (ms
// between measurements, 300 by default).
//
// It returns, for each target, found (the parts that match and are laid out) and shown (those
// framed now: inside the window and not covered by a dialog, a menu or anything else on top).
// found 0: that state is not on this screen. shown 0 with found > 0: scrolled away or covered.
// Calling showMarks again replaces the marks; clearMarks() takes them away; so does a reload.
//
// Nothing of the page is changed: the marks are one layer of their own on top of it, clicks pass
// through it, and the page's own code never sees it. The parts are measured again and again, so
// the frames follow what scrolls, grows or comes. Open shadow roots are searched too; parts in
// closed shadow roots, in iframes of another origin, or drawn inside a canvas cannot be found.
(() => {
  const ID = "show-marks-layer";
  const NOTES = {
    en: "The pink frames only show what changed. They are not part of the app, and a reload removes them.",
    ja: "桃色の枠は、変えた所を見せるための印です（アプリの一部ではありません。読み込み直すと消えます）",
  };
  const CORNERS = {
    "bottom-right": "right:8px;bottom:8px",
    "bottom-left": "left:8px;bottom:8px",
    "top-right": "right:8px;top:8px",
    "top-left": "left:8px;top:8px",
  };

  /** Every element of a root, open shadow roots included, the marks' own layer left out. */
  function elements(root, out = []) {
    for (const element of root.querySelectorAll("*")) {
      if (element.closest(`#${ID}`)) continue;
      out.push(element);
      if (element.shadowRoot) elements(element.shadowRoot, out);
    }
    return out;
  }

  function find(target, all = elements(document)) {
    let found = all.filter((e) => !target.selector || e.matches(target.selector));
    if (target.text) {
      const pattern = new RegExp(target.text);
      const hits = found.filter((e) => pattern.test((e.textContent || "").trim()));
      found = hits.filter((e) => !hits.some((other) => other !== e && e.contains(other)));
    }
    found = found.filter((e) => e.getClientRects().length > 0);
    if (target.pick === "first") return found.slice(0, 1);
    if (target.pick === "last") return found.slice(-1);
    return found;
  }

  /** The innermost element at a point, looking into open shadow roots. */
  function hitAt(x, y) {
    let hit = document.elementFromPoint(x, y);
    while (hit?.shadowRoot) {
      const inner = hit.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === hit) break;
      hit = inner;
    }
    return hit;
  }

  function within(node, ancestor) {
    for (let at = node; at; at = at.parentNode || at.host) if (at === ancestor) return true;
    return false;
  }

  /** Inside the window and on top at the middle of its visible part (the layer itself lets clicks through, so it is never hit). */
  function seen(element, rect) {
    const left = Math.max(rect.left, 0);
    const right = Math.min(rect.right, innerWidth);
    const top = Math.max(rect.top, 0);
    const bottom = Math.min(rect.bottom, innerHeight);
    if (right <= left || bottom <= top) return false;
    const hit = hitAt((left + right) / 2, (top + bottom) / 2);
    return Boolean(hit) && (within(hit, element) || within(element, hit));
  }

  function box(layer, rect, color) {
    const frame = document.createElement("div");
    frame.style.cssText = `position:fixed;left:${rect.left - 3}px;top:${rect.top - 3}px;width:${
      rect.width + 6
    }px;height:${rect.height + 6}px;border:3px solid ${color};border-radius:6px`;
    layer.append(frame);
  }

  function badge(layer, rect, label, color) {
    const number = document.createElement("div");
    number.textContent = label.split(" ")[0];
    number.style.cssText = `position:fixed;left:${rect.left - 14}px;top:${rect.top - 12}px;background:${color};color:#fff;font:700 13px/20px system-ui,sans-serif;min-width:20px;text-align:center;padding:0 3px;border-radius:10px`;
    layer.append(number);
  }

  function tag(layer, rect, label, color) {
    const words = document.createElement("div");
    words.textContent = label;
    const left = Math.max(4, Math.min(rect.left - 3, innerWidth - 12 - label.length * 8));
    const top = rect.top < 30 ? rect.bottom + 4 : rect.top - 24;
    words.style.cssText = `position:fixed;left:${left}px;top:${top}px;background:${color};color:#fff;font:600 12px/18px system-ui,sans-serif;padding:1px 6px;border-radius:4px;white-space:nowrap`;
    layer.append(words);
  }

  function draw(layer, targets, options) {
    layer.replaceChildren();
    const legend = document.createElement("div");
    legend.style.cssText = `position:fixed;${CORNERS[options.corner] || CORNERS["bottom-right"]};max-width:460px;background:${options.color};color:#fff;font:600 12px/18px system-ui,sans-serif;padding:6px 10px;border-radius:6px;opacity:0.94;display:flex;flex-direction:column;gap:2px`;
    const lines = [...(options.tags ? [] : targets.map((t) => t.label)), options.note];
    for (const line of lines) {
      const one = document.createElement("div");
      one.textContent = line;
      legend.append(one);
    }
    layer.append(legend);
    const all = elements(document);
    return targets.map((target) => {
      const found = find(target, all);
      let shown = 0;
      for (const element of found) {
        const rect = element.getBoundingClientRect();
        if (!seen(element, rect)) continue;
        shown += 1;
        box(layer, rect, options.color);
        (options.tags ? tag : badge)(layer, rect, target.label, options.color);
      }
      return { label: target.label, found: found.length, shown };
    });
  }

  window.clearMarks = () => {
    clearInterval(window.__showMarksTimer);
    document.getElementById(ID)?.remove();
  };

  window.showMarks = (targets, options = {}) => {
    window.clearMarks();
    const settled = {
      tags: Boolean(options.tags),
      color: options.color || "#d0198c",
      corner: options.corner || "bottom-right",
      note: options.note || NOTES[options.lang] || NOTES.en,
    };
    const layer = document.createElement("div");
    layer.id = ID;
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483647";
    document.body.append(layer);
    const counts = draw(layer, targets, settled);
    window.__showMarksTimer = setInterval(
      () => draw(layer, targets, settled),
      options.every || 300,
    );
    return counts;
  };
})();
