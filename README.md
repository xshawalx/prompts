# XSHAWALX Public AI Prompt Library

Target URL: https://xshawalx.github.io/prompts/

A static, data-driven prompt library for Shawal. Each published prompt is a small product with its own permanent SEO-friendly route, optional customization form, live preview, copy action, ChatGPT hand-off, sharing, related prompts and version metadata.

## Why this architecture

This project deliberately uses a tiny custom static generator instead of a framework. GitHub Pages receives plain HTML/CSS/JS, while source prompts remain structured JSON. That keeps runtime JavaScript small, avoids framework lock-in, and makes future ChatGPT maintenance predictable.

## Structure

- `content/prompts/*.json` — one real public prompt per file
- `content/schema/prompt.schema.json` — content contract
- `scripts/validate.mjs` — catches duplicate slugs, undefined placeholders and malformed records
- `scripts/build.mjs` — generates the landing page, clean prompt routes, search index, sitemap and structured metadata
- `assets/css/styles.css` — shared orange/black component system
- `assets/js/library.js` — client-side search + category filtering
- `assets/js/prompt.js` — dynamic fields, live preview, local persistence, copy/share actions
- `dist/` — generated deployment output; created by CI

## Local development

```bash
npm run check
python -m http.server 8080 -d dist
```

Then open `http://localhost:8080/`. The production build intentionally uses `/prompts/` absolute paths, so for exact local base-path testing use any static server that mounts `dist` at `/prompts/`, or temporarily inspect generated HTML directly.

## Add a prompt

Create one JSON file under `content/prompts/`. Do not add filler content. Preserve the supplied master prompt text unless a meaningful change is explicitly approved.

Minimum fields:

```json
{
  "slug": "job-search",
  "title": "AI Job Search Master Prompt",
  "description": "Turn ChatGPT into a structured job-search desk.",
  "audience": "Job seekers",
  "category": "Career",
  "tags": ["job search", "career"],
  "useCases": ["research roles"],
  "featured": true,
  "isNew": true,
  "version": "1.0",
  "updatedAt": "2026-09-23",
  "fields": [],
  "prompt": "Exact master prompt goes here."
}
```

Run `npm run check`. The index, categories, Featured section, search index, sitemap and route are derived automatically.

## Variables

Use `{{key}}` for a field value.

Use an optional block when an empty field should remove a whole line or section:

```text
{{#if location}}Target location: {{location}}{{/if}}
```

Supported field types:

`text`, `textarea`, `number`, `dropdown`, `multi-select`, `checkbox`, `radio`, `optional-text`, `required-text`, `date`, `range`, `url`.

Required fields block Copy Prompt until completed. Optional values are removed cleanly through `{{#if key}}...{{/if}}` blocks.

## Local persistence and privacy

Form values are stored only in the visitor's browser and automatically treated as stale after 7 days. Reset removes the saved values immediately. No form contents are sent to analytics.

## Featured and popularity

`featured: true` is manual curation. The site does not show fake view/use counts. Runtime hooks emit only these privacy-safe event names and prompt slug:

- `prompt_view`
- `prompt_copy`
- `open_chatgpt`
- `share_prompt`

A future analytics adapter can listen for `xshawalx:analytics` without changing prompt forms or exposing customization values.

## Related prompts

Use `relatedSlugs` when relationships are intentional. Otherwise, the build uses category and tag overlap and returns at most three prompts.

## Deployment

The included GitHub Actions workflow builds `dist/` and deploys it with GitHub Pages. The repository should be named `prompts` under `xshawalx` so the public path is exactly:

https://xshawalx.github.io/prompts/

In GitHub repository Settings → Pages, use **GitHub Actions** as the source if Pages is not already enabled.

## Brand tokens

Only two base colors are used:

- Orange `#FF6A00`
- Black `#000000`

Opacity variations are allowed for hierarchy. Do not introduce white, grey, beige, blue, green, purple or gradients.
