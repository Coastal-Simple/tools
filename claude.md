# Repository Guidelines

## Project Structure & Module Organization
This repository is a static Next.js website for CoastalSimple, hosted on GitHub Pages. The landing page lists tool cards with a logo, title, and short description, and each card links to `/{toolname}`.

- `src/` for app code, shared UI, and route logic
- `public/` for static assets such as tool logos and images
- `tests/` or `__tests__/` for automated tests
- `docs/` for notes, copy drafts, or implementation references

Keep tool-specific UI isolated by route or feature folder so each tool can evolve independently.

## Build, Test, and Development Commands
Use the Next.js and GitHub Pages workflow that fits a static export. Document exact commands in `README.md`. Common commands will likely include:

- `npm test` runs the test suite
- `npm run build` creates the static production build
- `npm run dev` starts the local development server
- a static export step that produces files for GitHub Pages

Do not introduce a server-only deployment path; the final output must remain static.

## Coding Style & Naming Conventions
Use the conventions of Next.js and TypeScript if the project adopts them. Keep formatting automated where possible, and prefer:

- 2 spaces for indentation
- `camelCase` for variables and functions, `PascalCase` for components, and lowercase route folders
- descriptive filenames that match the exported module or feature, such as `tool-card.tsx` or `weather-tool.tsx`

If you add linting or formatting tools, list the exact command here.

## Testing Guidelines
Add tests alongside the code they cover or in a dedicated test tree. Name tests after the behavior they verify, such as `tool-card.test.tsx` or `page.spec.ts`. Keep tests deterministic and avoid network access or machine-specific state.

## Commit & Pull Request Guidelines
This repository has no commit history yet, so no convention is established. Use concise, imperative commit messages such as `Add tool landing cards` or `Document static export setup`.

Pull requests should include:

- a short summary of the change
- mention of affected routes such as `/` or `/{toolname}`
- relevant issue links, if any
- screenshots or sample output for UI or CLI changes
- notes on testing performed

## Agent-Specific Instructions
Before changing files, inspect the current tree and avoid overwriting user work. Keep edits focused, and update this guide if the project structure or tooling changes.
