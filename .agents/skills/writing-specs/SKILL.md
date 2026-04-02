---
name: Writing Great Specs
description: How to write specs that produce accurate, high-quality AI output
---

# How to Write Specs That Actually Work

## The 5 Ingredients of a Great Spec

### 1. Context Table
Always start with a structured table of facts. AI tools parse tables faster than paragraphs.

```markdown
| Field | Value |
|---|---|
| App Name | Divi |
| What it does | Scans receipts, splits bills |
| Tech stack | React Native, Supabase, OpenAI |
```

### 2. Exact Output Format
Don't say "generate a page." Say exactly what files, what format, what structure.

```markdown
## Output Files
- `privacy_policy.html` — self-contained HTML5, no external dependencies
- `privacy_policy.docx` — US Letter, Arial 12pt, page numbers in footer
```

### 3. Concrete Examples
Include at least one example of what "good" looks like. AI anchors heavily on examples.

```markdown
## Example Opening Paragraph (Tone Reference)
> Divi is a simple tool — you point your camera at a receipt...
```

### 4. Constraints (What NOT to Do)
Negative constraints are just as important as positive ones. They prevent hallucination.

```markdown
- Do NOT include Subtotal, Tax, or Total as line items
- No ALL CAPS sections
- No external CDN calls — must work as a static file
```

### 5. Verification Checklist
End with a checklist the AI must confirm before finishing. This forces self-review.

```markdown
## Checklist
- [ ] OpenAI explicitly named as third-party processor
- [ ] COPPA compliance statement present
- [ ] HTML file is mobile-responsive
```

## Common Mistakes to Avoid

| Mistake | Fix |
|---|---|
| "Make it look good" | "Use system-ui font, #222 text, #2563EB headers" |
| "Handle errors" | "Show Alert.alert with title 'Error' and the message from catch block" |
| "Add tests" | "Add a test that sends test-receipt-1.jpg and expects 9 items, $7.78 tax, $87.53 total" |
| Not specifying file paths | Always say exactly where files should be created |
| Forgetting tone | Include a 2-sentence tone example so the AI matches your voice |

## Template for New Specs

```markdown
# Spec: [Feature Name]

## Context
| Field | Value |
|---|---|
| ... | ... |

## Requirements
1. ...
2. ...

## Output Files
- `path/to/file.ext` — description

## Constraints
- Do NOT ...
- Must ...

## Example
> ...

## Verification Checklist
- [ ] ...
```
