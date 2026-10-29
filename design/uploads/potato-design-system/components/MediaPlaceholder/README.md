# MediaPlaceholder

The stand-in for screenshots and video: `radius-hero`, a dashed `line-dashed` border over `grad-media`, and a 13px caption that says what goes there (“media · 4:3 · screenshot or video”). Pass `src` and it becomes the real image (or `video`) with the border removed.

- Set `ratio` (`"4 / 3"`, `"16 / 9"`, `"16 / 10"`); blocks set their own.
- Never ship a placeholder: the caption is an instruction for the CMS editor.
