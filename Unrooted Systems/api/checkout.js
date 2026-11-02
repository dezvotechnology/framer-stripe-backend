const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { totalPrice, product, orderId } = req.body;

      // Ensure amount is valid number
      const finalAmount = totalPrice && Number(totalPrice) > 0 ? Number(totalPrice) : 1000;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              product_data: {
                name: product ? `Custom ${product}` : 'Custom Product Configuration',
              },
              unit_amount: Math.round(finalAmount * 100), // Dynamic amount calculation
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.origin || 'https://framer.com'}?orderId=${orderId}&success=true`,
        cancel_url: `${req.headers.origin || 'https://framer.com'}?canceled=true`,
      });

      return res.status(200).json({ url: session.url });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
