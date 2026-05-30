import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
        return new Response('Missing token', { status: 400 });
    }

    // Fetch payment request + contact name
    const { data: pr, error } = await db
        .from('payment_requests')
        .select('id, status, amount, items, token, contact_id, owner_id, contacts(contact_name)')
        .eq('token', token)
        .single();

    if (error || !pr) {
        return new Response('Payment request not found', { status: 404 });
    }

    // Fetch owner profile separately (owner_id → auth.users, not directly to profiles)
    const { data: owner } = await db
        .from('profiles')
        .select('full_name, venmo_handle, cashapp_handle, zelle_number, expo_push_token')
        .eq('id', pr.owner_id)
        .single();

    const contact = Array.isArray(pr.contacts) ? pr.contacts[0] : pr.contacts;
    const contactName: string = contact?.contact_name ?? 'You';
    const ownerName: string = owner?.full_name ?? 'Someone';
    const amount: number = pr.amount ?? 0;
    const items: Array<{ name: string; price: number }> = Array.isArray(pr.items) ? pr.items : [];

    // --- POST: "I sent it" ---
    if (req.method === 'POST') {
        if (pr.status === 'settled') {
            return new Response(JSON.stringify({ ok: true, already: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Mark as pending
        const { error: updateErr } = await db
            .from('payment_requests')
            .update({ status: 'pending', pending_at: new Date().toISOString() })
            .eq('token', token);

        if (updateErr) {
            return new Response(JSON.stringify({ error: 'Could not update status' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Send push notification to owner if they have a token
        const pushToken: string | null = owner?.expo_push_token ?? null;
        if (pushToken) {
            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: pushToken,
                    title: 'Payment received',
                    body: `${contactName} says they sent $${amount.toFixed(2)}. Tap to confirm.`,
                    data: { token },
                    sound: 'default',
                }),
            });
        }

        return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // --- GET: render HTML pay page ---
    const alreadyPaid = pr.status === 'settled' || pr.status === 'pending';

    const itemRows = items.map((item) =>
        `<tr>
            <td>${escHtml(item.name)}</td>
            <td class="price">$${item.price.toFixed(2)}</td>
        </tr>`
    ).join('');

    const paymentButtons: string[] = [];
    if (owner?.venmo_handle) {
        const handle = (owner.venmo_handle as string).replace('@', '');
        const note = encodeURIComponent(`Divi: $${amount.toFixed(2)}`);
        paymentButtons.push(
            `<a href="venmo://paycharge?txn=pay&recipients=${encodeURIComponent(handle)}&amount=${amount.toFixed(2)}&note=${note}" class="pay-btn venmo">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.4 2c.5 1.2.7 2.4.7 3.9 0 4.9-4.2 11.2-7.6 15.7H5.3L2 4l6.5-.6 1.7 13.4c1.6-2.6 3.5-6.7 3.5-9.5 0-1.5-.3-2.5-.7-3.4L19.4 2z"/></svg>
                Pay with Venmo
            </a>`
        );
    }
    if (owner?.cashapp_handle) {
        const handle = (owner.cashapp_handle as string).replace('$', '');
        paymentButtons.push(
            `<a href="https://cash.app/$${encodeURIComponent(handle)}/${amount.toFixed(2)}" class="pay-btn cashapp">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.2 7.2l-.7-2.6A7 7 0 0 0 12 3a7 7 0 0 0-7 7c0 3.1 2 5.8 4.9 6.7l.7 2.6A1 1 0 0 0 11.5 20h1a1 1 0 0 0 1-.8l.7-2.6A7 7 0 0 0 19 10a7 7 0 0 0-1.8-2.8zM12 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/></svg>
                Pay with Cash App
            </a>`
        );
    }
    if (owner?.zelle_number) {
        paymentButtons.push(
            `<div class="zelle-block">
                <p class="zelle-label">Pay with Zelle</p>
                <p class="zelle-number">${escHtml(owner.zelle_number as string)}</p>
            </div>`
        );
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <title>Divi: Pay ${escHtml(ownerName)}</title>
    <meta name="description" content="${escHtml(contactName)}, you owe $${amount.toFixed(2)} to ${escHtml(ownerName)}." />
    <meta property="og:site_name" content="Divi" />
    <meta property="og:title" content="${escHtml(contactName)} owes $${amount.toFixed(2)}" />
    <meta property="og:description" content="${escHtml(ownerName)} covered the bill. Tap to pay back." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escHtml(contactName)} owes $${amount.toFixed(2)}" />
    <meta name="twitter:description" content="${escHtml(ownerName)} covered the bill. Tap to pay back." />
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #F5F5F5;
            color: #111;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 24px 16px 48px;
        }
        .logo {
            font-size: 22px;
            font-weight: 700;
            color: #1DB954;
            letter-spacing: -0.5px;
            margin-bottom: 24px;
        }
        .card {
            background: #fff;
            border-radius: 16px;
            padding: 20px;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.08);
            margin-bottom: 16px;
        }
        .from-label {
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-bottom: 4px;
        }
        .from-name {
            font-size: 20px;
            font-weight: 700;
            color: #111;
        }
        .from-sub {
            font-size: 13px;
            color: #666;
            margin-top: 2px;
        }
        .divider {
            height: 1px;
            background: #F0F0F0;
            margin: 16px 0;
        }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 6px 0; font-size: 14px; color: #444; }
        td.price { text-align: right; font-weight: 600; color: #111; white-space: nowrap; }
        .total-row { font-size: 18px; font-weight: 800; color: #1DB954; }
        .total-row td { padding-top: 10px; }
        .payment-section {
            width: 100%;
            max-width: 420px;
        }
        .section-label {
            font-size: 11px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-bottom: 10px;
        }
        .pay-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 16px 20px;
            border-radius: 14px;
            font-size: 15px;
            font-weight: 700;
            text-decoration: none;
            margin-bottom: 10px;
            transition: opacity 0.15s;
        }
        .pay-btn:active { opacity: 0.75; }
        .pay-btn svg { width: 22px; height: 22px; flex-shrink: 0; }
        .venmo { background: #3D95CE; color: #fff; }
        .cashapp { background: #00C244; color: #fff; }
        .zelle-block {
            background: #fff;
            border-radius: 14px;
            padding: 16px 20px;
            margin-bottom: 10px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .zelle-label { font-size: 12px; color: #999; margin-bottom: 4px; }
        .zelle-number { font-size: 17px; font-weight: 700; color: #6D1ED4; }
        .sent-btn {
            display: block;
            width: 100%;
            max-width: 420px;
            margin-top: 20px;
            padding: 18px;
            background: #111;
            color: #fff;
            border: none;
            border-radius: 14px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: opacity 0.15s;
        }
        .sent-btn:active { opacity: 0.75; }
        .sent-btn:disabled { background: #ccc; cursor: default; }
        .already-msg {
            margin-top: 20px;
            padding: 16px 20px;
            background: #E8F8EE;
            border-radius: 14px;
            color: #1DB954;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
            width: 100%;
            max-width: 420px;
        }
        .note {
            font-size: 12px;
            color: #bbb;
            text-align: center;
            margin-top: 16px;
            max-width: 320px;
        }
    </style>
</head>
<body>
    <div class="logo">divi</div>

    <div class="card">
        <div class="from-label">Requested by</div>
        <div class="from-name">${escHtml(ownerName)}</div>
        <div class="from-sub">Hi ${escHtml(contactName)}, here's what you owe</div>
        <div class="divider"></div>
        <table>
            ${itemRows}
            <tr class="total-row">
                <td>Total</td>
                <td class="price">$${amount.toFixed(2)}</td>
            </tr>
        </table>
    </div>

    ${paymentButtons.length > 0 ? `
    <div class="payment-section">
        <div class="section-label">Pay via</div>
        ${paymentButtons.join('')}
    </div>` : ''}

    ${alreadyPaid
        ? `<div class="already-msg">Payment confirmed. Thanks!</div>`
        : `<button class="sent-btn" id="sentBtn" onclick="markSent()">I sent it</button>
           <p class="note">Tap after sending payment. ${escHtml(ownerName)} will confirm.</p>`
    }

    <script>
        async function markSent() {
            const btn = document.getElementById('sentBtn');
            btn.disabled = true;
            btn.textContent = 'Sending...';
            try {
                const res = await fetch(location.href, { method: 'POST' });
                const json = await res.json();
                if (json.ok) {
                    btn.textContent = 'Sent!';
                    btn.style.background = '#1DB954';
                } else {
                    btn.disabled = false;
                    btn.textContent = 'I sent it';
                    alert('Something went wrong. Try again.');
                }
            } catch {
                btn.disabled = false;
                btn.textContent = 'I sent it';
                alert('Something went wrong. Try again.');
            }
        }
    </script>
</body>
</html>`;

    const htmlHeaders = new Headers();
    htmlHeaders.set('Content-Type', 'text/html; charset=utf-8');
    htmlHeaders.set('Cache-Control', 'no-store');
    htmlHeaders.set('Access-Control-Allow-Origin', '*');
    return new Response(html, { headers: htmlHeaders });
});

function escHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
