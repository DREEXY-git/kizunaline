export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const body = req.body;

  // Shopify注文データから顧客情報抽出
  const customer = body.customer || {};
  const email = customer.email;
  const name = `${customer.first_name || ''} ${customer.last_name || ''}`;
  const phone = customer.phone || '';
  const purchasedItems = body.line_items || [];

  // 商品名をタグ化（例）
  const tags = purchasedItems.map(item => item.title);

  // UTAGEに送信するデータ構築（仕様に応じてカスタマイズ）
  const utagePayload = {
    email,
    name,
    phone,
    tags,  // UTAGEが複数タグ受け入れる仕様の場合
    custom_fields: {
      total: body.total_price,
      order_id: body.id,
    }
  };

  try {
    const utageRes = await fetch(process.env.UTAGE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UTAGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(utagePayload)
    });

    const result = await utageRes.json();
    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error('Error sending to UTAGE:', err);
    return res.status(500).json({ error: 'Failed to send to UTAGE' });
  }
}
