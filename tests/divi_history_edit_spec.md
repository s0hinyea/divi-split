d# Claude Code Spec: History "Edit Split" Feature

## Objective
Implement a read-only historical receipt detail view with an "Edit Split" capability. Pressing edit must seamlessly load the past receipt into local state and route the user to the contacts screen, allowing them to modify the split. The backend implementation must follow ACID principles using PostgreSQL/Supabase to guarantee data consistency.

## 🚨 Required Agent Constraints
- **CRITICAL:** You MUST review and follow the conventions laid out in `.agents/skills/divi-architecture/SKILL.md` before writing any code.
- **CRITICAL:** You MUST review and follow the post-feature verification conventions in `.agents/workflows/how-to-work.md`.

---

## 1. User Flow & UX Requirements

1. **Tap to View (`history.tsx`)**
   - User taps a past receipt from the History tab.
   - App navigates to a new Read-Only Receipt Detail Screen (e.g., `app/receipt/[id].tsx`).
   
2. **Read-Only Summary Screen**
   - Displays a clean summary of the receipt: merchant name, total, tax, tip.
   - Displays a breakdown of who was assigned what, and their individual totals.
   - At the bottom of the screen, place a prominent "Edit Split" button.

3. **Hitting "Edit Split"**
   - When tapped, the app must hydrate the Zustand `splitStore` with the receipt data, item data, and contact assignments pulled from the DB.
   - It should then route the user to `app/contacts.tsx` (the contact list screen).
   - *Why contacts?* So they can add a friend they forgot, or remove someone who backed out.
   - From contacts, pressing "Next" naturally takes them to the `app/assign.tsx` canvas, perfectly restored to their past session.

---

## 2. Technical Implementation: Database State & ACID Compliance

The overriding technical rule for this feature is **ACID compliance** (Atomicity, Consistency, Isolation, Durability). 

When a user edits an old receipt and hits "Save" at the end of the assignment flow, we absolutely **cannot** use multiple, independent JavaScript-level Supabase calls (e.g. independently waiting for a `delete()` then an `insert()`). That introduces a race condition and a risk of partial failure resulting in corrupted/orphaned data.

### The Rule: "Local State Until Full Save"
- 100% of the editing happens in the local frontend state (`splitStore`). 
- The existing receipt in the database is completely untouched while the user makes changes.
- It is only overwritten if and when they hit the final "Save/Finish" button on the UI.

### The Mechanism: Supabase Postgres RPC (Transaction)
To achieve atomicity, the save operation must be a single call to a Postgres Function (RPC). 

You will need to write and apply a new Supabase migration that creates an RPC function (e.g., `update_receipt_split`). 

**The Postgres Function must use a `plpgsql` block structure exactly like this:**
```sql
BEGIN;
  -- 1. Verify ownership of the receipt
  
  -- 2. Update the parent `receipts` row (total, tax, tip, merchant)
  
  -- 3. DELETE all existing `receipt_items` for this receipt_id 
  --    (Assuming cascading deletes handles the `item_assignments` table automatically. 
  --    If not, delete assignments first!)
  
  -- 4. INSERT the new `receipt_items`
  
  -- 5. INSERT the new `item_assignments` 
COMMIT;
```

If any single step fails, the transaction automatically rolls back via Postgres, ensuring the user's previous receipt state is 100% preserved.

---

## Acceptance Criteria Checklist

- [ ] A new detail screen exists to view a receipt without accidentally editing it.
- [ ] Tapping "Edit Split" correctly populates the Zustand `splitStore` and navigates to `contacts.tsx`.
- [ ] Saving an edited receipt does not create duplicate `receipts` rows.
- [ ] Saving an edited receipt successfully overwrites previous items and assignments.
- [ ] A single Supabase RPC function (transaction) handles the save process.
- [ ] If the app closes or crashes mid-edit, the original DB receipt remains completely intact.
