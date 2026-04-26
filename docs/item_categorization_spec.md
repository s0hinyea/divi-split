# Item Categorization Strategy — Spec

## 1. Overview
Currently, the OCR pipeline uses OpenAI's Structured Outputs to extract raw receipt items (name, price). This spec outlines how we will add an AI-driven classification layer to group items into logical buckets (e.g., drinks, appetizers, entrees). 

Because we are already using GPT-4o Vision for extraction, we can implement this classification at **zero marginal cost** (no extra latency, no secondary API calls) simply by updating the allowed JSON Schema. This lays the critical data foundation for powerful downstream agentic features.

---

## 2. Technical Implementation

### Current State
In `supabase/functions/ocr-vision/index.ts`, the OpenAI Structured Outputs schema defines an item roughly as:
```json
{
  "name": {"type": "string"},
  "price": {"type": "number"}
}
```

### Target State
We will inject an enum `category` property into the JSON schema.

**Backend Schema Update:**
```json
{
  "name": {"type": "string"},
  "price": {"type": "number"},
  "category": {
    "type": "string",
    "enum": ["drink", "appetizer", "entree", "dessert", "side", "other"],
    "description": "Categorize the item into one of the allowed types. Use 'other' if unclear or for fees/upcharges."
  }
}
```

**Frontend Type Update (`stores/splitStore.ts`):**
```typescript
export type ItemCategory = 'drink' | 'appetizer' | 'entree' | 'dessert' | 'side' | 'other';

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  category?: ItemCategory; // Set to optional for backward compatibility with old history
}
```

---

## 3. Taxonomy Definition
To prevent the model from over-analyzing or hallucinating, we restrict it to 6 rigid buckets. 

| Category | Definition & Examples |
| :--- | :--- |
| `drink` | Any beverage (Alcoholic, sodas, water, coffee, tea). |
| `appetizer` | Shared starters, small plates eaten before the meal, bread, wings. |
| `entree` | Main courses, burgers, large pasta bowls, steaks, sandwiches. |
| `side` | Supplementary small items: Fries, rice, extra dipping sauce bowls. |
| `dessert` | Sweets, cakes, ice cream, post-meal items. |
| `other` | Catch-all for ambiguity: Kids meals, add-ons (e.g., "+ chicken"), retail items, fees. |

---

## 4. Handling Edge Cases & Ambiguity

The biggest concern with classification is overlap (e.g., Is "Loaded Nachos" an appetizer or an entree? Is "Mango Lassi" a drink or a dessert?).

**Why it doesn't matter:**
1. **No Math Breakage:** A misclassification does not change the price or total. It only affects UI grouping or agentic shortcuts. 
2. **Contextual Consistency:** Because GPT-4o processes the entire receipt simultaneously, it enforces consistency *within that specific receipt*. If it decides tapas are appetizers, it will label all similar tapas as appetizers.
3. **Graceful Fallback:** If the user has to manually assign a miscategorized an item, the UX simply defaults to what the app is today (tap-to-assign). The categorization is a progressive enhancement, not a critical failure point.
4. **The 'Other' Escape Hatch:** Supplying the `other` bucket prevents the JSON schema validator from throwing an error if the model encounters something bizarre (like a restaurant selling a t-shirt on a food receipt).

---

## 5. Downstream Agentic Features Unlocked

By having strongly-typed categories on every item, we immediately unblock the following UX superpowers:

### A. NLP Voice Commands
When the user employs the Voice Assistant, they can issue bulk commands.
*   **User:** *"Assign all the drinks to Sarah."*
*   **Agent Logic:** Filters `items.filter(i => i.category === 'drink')` and triggers `assign_item` in bulk.

### B. Smart Auto-Splits
The UI can look at the receipt composition and offer intelligent presets upon load.
*   **UI Prompt:** *"I see 3 appetizers. These are usually shared. Want to split them evenly among everyone?"*

### C. Visual Grouping (Cognitive Load Reduction)
Currently, a 30-item receipt is a massive wall of text. With categories, the `Modify Receipt` and `Assign` screens can partition the list under sticky section headers (`Entrees`, `Drinks`), making the receipt instantly scannable and mirroring how people naturally think about meals.

### D. Analytics (Future)
The `History` screen can evolve into a spending dashboard: *"You spent 45% of your bill on drinks last night."*
