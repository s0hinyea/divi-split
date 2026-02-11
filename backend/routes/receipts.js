import { Router } from 'express';
import { verifyAuth } from '../authMiddleware.js';
import { supabase } from '../supabaseClient.js';

const router = Router();

// GET /receipts - Fetch user's receipts with items (supports pagination)
router.get('/', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.sub;
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        const { data: receipts, error, count } = await supabase
            .from('receipts')
            .select(`
        id,
        receipt_name,
        total_amount,
        tax_amount,
        tip_amount,
        created_at,
        receipt_items (
          id,
          item_name,
          item_price
        )
      `, { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        console.log(`[Receipts] Fetched ${receipts.length} receipts for user (offset: ${offset})`);
        res.json({
            receipts,
            total: count,
            hasMore: offset + receipts.length < count
        });

    } catch (error) {
        console.error('[Receipts] Fetch error:', error.message);
        res.status(500).json({ error: 'Failed to fetch receipts', details: error.message });
    }
});

// DELETE /receipts/:id - Delete a receipt (cascades to items via FK)
router.delete('/:id', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.sub;
        const receiptId = req.params.id;

        // First verify this receipt belongs to the user
        const { data: receipt, error: fetchError } = await supabase
            .from('receipts')
            .select('id')
            .eq('id', receiptId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !receipt) {
            return res.status(404).json({ error: 'Receipt not found or unauthorized' });
        }

        // Delete associated items first (if no cascade)
        await supabase
            .from('receipt_items')
            .delete()
            .eq('receipt_id', receiptId);

        // Delete the receipt
        const { error: deleteError } = await supabase
            .from('receipts')
            .delete()
            .eq('id', receiptId);

        if (deleteError) throw deleteError;

        console.log(`[Receipts] Deleted receipt ${receiptId}`);
        res.json({ success: true, message: 'Receipt deleted' });

    } catch (error) {
        console.error('[Receipts] Delete error:', error.message);
        res.status(500).json({ error: 'Failed to delete receipt', details: error.message });
    }
});

// POST /receipts - Save a complete receipt with items, contacts, and assignments
router.post('/', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.sub;
        const { receipt_name, receipt_date, items, contacts, tax, tip, total } = req.body;

        console.log('[Receipts] Saving new receipt for user:', userId);

        // 1. Insert the receipt
        const { data: receipt, error: receiptError } = await supabase
            .from('receipts')
            .insert({
                user_id: userId,
                receipt_name: receipt_name || 'Untitled Receipt',
                total_amount: total || 0,
                tax_amount: tax || 0,
                tip_amount: tip || 0,
                created_at: receipt_date || new Date().toISOString()
            })
            .select()
            .single();

        if (receiptError) throw receiptError;
        console.log('[Receipts] Created receipt:', receipt.id);

        // 2. Insert receipt items
        let insertedItems = [];
        let frontendToDbItemMap = {};

        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
                receipt_id: receipt.id,
                item_name: item.name,
                item_price: item.price
            }));

            const { data: itemsData, error: itemsError } = await supabase
                .from('receipt_items')
                .insert(itemsToInsert)
                .select();

            if (itemsError) throw itemsError;
            insertedItems = itemsData || [];

            items.forEach((item, index) => {
                if (insertedItems[index]) {
                    frontendToDbItemMap[item.id] = insertedItems[index].id;
                }
            });

            console.log('[Receipts] Inserted', insertedItems.length, 'items');
        }

        // 3. Insert contacts and create assignments
        if (contacts && contacts.length > 0) {
            for (const contact of contacts) {
                const { data: insertedContact, error: contactError } = await supabase
                    .from('contacts')
                    .insert({
                        user_id: userId,
                        contact_name: contact.name,
                        phone_number: contact.phoneNumber,
                        contact_id: contact.id
                    })
                    .select()
                    .single();

                if (contactError) {
                    console.error('[Receipts] Contact insert error:', contactError.message);
                    continue;
                }

                if (contact.items && contact.items.length > 0) {
                    const assignments = contact.items.map(item => {
                        const dbItemId = frontendToDbItemMap[item.id];
                        return {
                            item_id: dbItemId,
                            contact_id: insertedContact.id
                        };
                    }).filter(a => a.item_id);

                    if (assignments.length > 0) {
                        const { error: assignmentError } = await supabase
                            .from('assignments')
                            .insert(assignments);

                        if (assignmentError) {
                            console.error('[Receipts] Assignment error:', assignmentError.message);
                        }
                    }
                }
            }
            console.log('[Receipts] Processed', contacts.length, 'contacts');
        }

        console.log('[Receipts] Successfully saved complete receipt:', receipt.id);
        res.json({ success: true, receipt });

    } catch (error) {
        console.error('[Receipts] Save error:', error.message);
        res.status(500).json({ error: 'Failed to save receipt', details: error.message });
    }
});

export default router;
