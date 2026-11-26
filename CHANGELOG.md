# Changelog

The main changes in each version. A version is a tag and a [release](https://github.com/microtaro/show-changes/releases) of this repository.

[日本語](CHANGELOG.ja.md)

## Unreleased

<!-- When releasing, rename this heading to "<version> - <date>". -->

### Added

- The `show-changes` skill and its script `show-marks.js`: numbered frames on the changed parts of a live page and one legend, measured again every 0.3 s so they follow the page, with clicks passing through.
- Marks name their part by the words in it and/or a CSS selector, and report how many parts each found and how many are framed now (found 0: that state is not on the screen yet). Parts under a dialog, a menu or anything else on top get no frame.
- The note said with the marks in English or Japanese, or your own; the legend's corner, the color, and labels beside the frames instead of in the legend.
- Open shadow roots are searched.
- A demo on another app's plan screen, in English and Japanese.
