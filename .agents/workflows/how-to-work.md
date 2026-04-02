---
description: How to work with Sohi on Divi features
---

# How to Work on Divi

## Before Starting Any Feature
1. Read the architecture skill: `.agents/skills/divi-architecture/SKILL.md`
2. Check `tests/` for any existing specs related to the feature
3. Check the current task list in the conversation artifacts

## Code Conventions
- All styles use theme tokens from `@/styles/theme` — never hardcode colors
- Use `SafeAreaView` from `react-native-safe-area-context`, NOT from `react-native`
- Edge functions use `npm:` imports, not node_modules
- Always use `getUserFacingErrorMessage()` from `@/utils/network` for error alerts

## When Done with a Feature
// turbo-all
1. Run integration tests: `node tests/scripts/ocr-pipeline.integration.test.js`
2. Stage, commit, and push: `git add -A && git commit -m "<message>" && git push origin main`
3. Explain in simple manners the architecural and technical decisions and choices you made, to progress Sohi and his knowledge of software engineering and building AI-systems, and what he should take away. 