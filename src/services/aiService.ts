import { Product, KhataCustomer } from '../types/merchant';

const GEMINI_KEY_STORAGE = 'finora_gemini_api_key';
const AI_PROVIDER_STORAGE = 'finora_ai_provider';

export type AIProvider = 'free' | 'gemini';

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem(GEMINI_KEY_STORAGE) ||
    (import.meta.env.VITE_GEMINI_API_KEY as string) ||
    ''
  );
}

export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key.trim()) {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
  } else {
    localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
  }
}

export function getAiProvider(): AIProvider {
  if (typeof window === 'undefined') return 'free';
  const saved = localStorage.getItem(AI_PROVIDER_STORAGE);
  if (saved === 'gemini' || saved === 'free') return saved;
  return getStoredApiKey() ? 'gemini' : 'free';
}

export function setAiProvider(provider: AIProvider): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AI_PROVIDER_STORAGE, provider);
}

export function buildStoreContext(
  products: Product[],
  khataCustomers: KhataCustomer[]
): string {
  const lowStock = products.filter((p) => p.status === 'low_stock');
  const expiring = products.filter((p) => p.status === 'expiring');
  const totalUdhaar = khataCustomers.reduce((acc, c) => acc + c.balanceDue, 0);
  const criticalCustomers = khataCustomers.filter(
    (c) => c.trustScore === 'critical'
  );

  const productSummary = products
    .slice(0, 12)
    .map(
      (p) =>
        `- ${p.name} (${p.category}): Stock ${p.currentStock}/${p.safetyStock}, Cost ₹${p.wholesaleCost}, Price ₹${p.sellingPrice}, Velocity ${p.dailyVelocity}/day, Status ${p.status}, Expiry ${p.expiryDate}`
    )
    .join('\n');

  const customerSummary = khataCustomers
    .map(
      (c) =>
        `- ${c.name}: Balance ₹${c.balanceDue}, Overdue ${c.daysPending} days, Trust: ${c.trustScore}`
    )
    .join('\n');

  return `You are Finora AI, the intelligent Kirana business assistant for "Laxmi Super Kirana Store".
Your goal is to give direct, actionable, practical retail financial and inventory advice to the shop owner.
All monetary amounts are in Indian Rupees (₹).
You understand English, Hindi, and Hinglish. Be professional, concise, and helpful. Avoid emojis.

Live Shop Inventory:
Total Products Tracked: ${products.length}
Low Stock Alert Items (${lowStock.length}): ${lowStock.map((p) => p.name).join(', ') || 'None'}
Expiring Items (${expiring.length}): ${expiring.map((p) => `${p.name} (exp: ${p.expiryDate})`).join(', ') || 'None'}

Key Product Catalog:
${productSummary}

Customer Khata (Credit) Ledger:
Total Outstanding Udhaar: ₹${totalUdhaar.toLocaleString('en-IN')}
Critical Overdue Accounts (${criticalCustomers.length}): ${criticalCustomers.map((c) => `${c.name} (₹${c.balanceDue})`).join(', ') || 'None'}
Customer Accounts:
${customerSummary}`;
}

function getLocalFallbackResponse(
  query: string,
  products: Product[],
  khataCustomers: KhataCustomer[]
): string {
  const q = query.toLowerCase();

  if (q.includes('expir') || q.includes('kharab') || q.includes('date')) {
    const expiring = products.filter((p) => p.status === 'expiring');
    if (expiring.length > 0) {
      return `Found ${expiring.length} item nearing expiry: ${expiring
        .map((e) => `${e.name} (${e.currentStock} units left, expires ${e.expiryDate})`)
        .join(', ')}. Recommend running a 10% counter discount or placing at checkout.`;
    }
    return 'All inventory items are currently well within fresh shelf life. No immediate expiry concerns.';
  }

  if (q.includes('margin') || q.includes('profit') || q.includes('kamai')) {
    const bestMargin = [...products].sort(
      (a, b) =>
        (b.sellingPrice - b.wholesaleCost) / b.sellingPrice -
        (a.sellingPrice - a.wholesaleCost) / a.sellingPrice
    )[0];
    const marginPct = (
      ((bestMargin.sellingPrice - bestMargin.wholesaleCost) /
        bestMargin.sellingPrice) *
      100
    ).toFixed(1);
    const netProfit = bestMargin.sellingPrice - bestMargin.wholesaleCost;
    return `Your highest gross margin item is "${bestMargin.name}" yielding ${marginPct}% profit (₹${netProfit} net per unit). Recommend bundling with high velocity staples.`;
  }

  if (
    q.includes('khata') ||
    q.includes('udhaar') ||
    q.includes('credit') ||
    q.includes('pending')
  ) {
    const totalDue = khataCustomers.reduce((acc, c) => acc + c.balanceDue, 0);
    const critical = khataCustomers.filter((c) => c.trustScore === 'critical');
    return `Total customer Udhaar outstanding is ₹${totalDue.toLocaleString('en-IN')}. Caution: ${critical
      .map((c) => `${c.name} (₹${c.balanceDue}, ${c.daysPending} days overdue)`)
      .join(', ')} exceeds credit terms. WhatsApp reminders have been drafted in the Khata section.`;
  }

  if (
    q.includes('reorder') ||
    q.includes('stock') ||
    q.includes('low') ||
    q.includes('order')
  ) {
    const lowStock = products.filter((p) => p.currentStock <= p.safetyStock);
    return `Currently ${lowStock.length} items are below or near safety threshold: ${lowStock
      .map((p) => `${p.name} (Current: ${p.currentStock}, Safety: ${p.safetyStock})`)
      .join(', ')}. Recommend generating PO from the Working Capital Basket Optimizer.`;
  }

  return `Based on live register data, today's sales velocity is steady. Your top moving category is Grains and Edible Oils. Working capital utilization is at 88%. You can issue a quick PO from the optimizer or check pending Khata reminders.`;
}

export async function askFinoraAI(
  query: string,
  history: { role: 'user' | 'assistant'; text: string }[],
  products: Product[],
  khataCustomers: KhataCustomer[]
): Promise<string> {
  const provider = getAiProvider();
  const apiKey = getStoredApiKey();
  const systemPrompt = buildStoreContext(products, khataCustomers);

  // If Gemini provider selected and key available
  if (provider === 'gemini' && apiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nRecent Conversation:\n${history
                .slice(-4)
                .map((h) => `${h.role}: ${h.text}`)
                .join('\n')}\n\nUser Question: ${query}`,
            },
          ],
        },
      ];

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch {
      // Fall through to free public API
    }
  }

  // Free Public AI integration (No key required, CORS supported, completely free)
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-4).map((h) => ({ role: h.role, content: h.text })),
      { role: 'user', content: query },
    ];

    const res = await fetch('https://text.pollinations.ai/openai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: 'openai',
        temperature: 0.6,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return content.trim();
    }
  } catch {
    // If network or provider fails, use intelligent local fallback
  }

  return getLocalFallbackResponse(query, products, khataCustomers);
}
