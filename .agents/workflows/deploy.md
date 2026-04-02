---
description: How to deploy changes to production (edge functions + git push)
---

# Deploy to Production

## Pre-Deploy: Run Integration Tests
// turbo
1. Run the OCR integration tests to make sure nothing is broken:
```bash
node tests/scripts/ocr-pipeline.integration.test.js
```
If any tests fail, DO NOT proceed. Fix the failing tests first.

## Deploy Edge Functions
2. Deploy the OCR edge function to Supabase:
```bash
npx supabase functions deploy ocr-vision
```

## Commit and Push
3. Stage all changed files, commit with a descriptive message, and push to main:
```bash
git add -A && git commit -m "<descriptive message>" && git push origin main
```
