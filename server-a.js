const express = require('express');
const retry = require('async-retry');
const httpClient = require('./http-client'); // Thay thế axios bằng httpClient

const app = express();
app.use(express.json());

// Sample data
let products = [
  { id: 1, name: 'Laptop', stock: 10 },
  { id: 2, name: 'Phone', stock: 20 }
];
let payments = [
  { orderId: 1, status: 'pending', amount: 1000 }
];

// Inventory endpoints
app.get('/products', (req, res) => {
  res.json(products);
});

app.post('/update-stock', async (req, res) => {
  const { productId, quantity, orderId } = req.body;
  const product = products.find(p => p.id === productId);

  if (!product || product.stock < quantity) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }

  product.stock -= quantity;

  let retryCount = 0;
  
  try {
    await retry(async (bail, attempt) => {
      retryCount = attempt;
      console.log(`Attempt ${attempt} to connect to Shipping Service...`);
      try {
        // Sử dụng httpClient thay vì axios
        await httpClient.post('http://localhost:3001/ship-order', { orderId });
        console.log(`Attempt ${attempt}: Connection successful`);
      } catch (err) {
        console.log(`Attempt ${attempt}: Failed - ${err.message}`);
        throw err;
      }
    }, {
      retries: 5,
      minTimeout: 3000,
      maxTimeout: 3000,
      factor: 1,
      onRetry: (error) => {
        console.log(`Retrying after error: ${error.message}`);
      }
    });

    res.json({ message: 'Stock updated and order shipped' });
  } catch (error) {
    console.log(`All ${retryCount} attempts failed. Giving up.`);
    res.status(500).json({ error: 'Failed to ship order' });
  }
});

// Payment endpoints
app.post('/process-payment', (req, res) => {
  const { orderId, amount } = req.body;
  payments.push({ orderId, status: 'paid', amount });
  res.json({ message: 'Payment processed' });
});

app.listen(3000, () => {
  console.log('Server A running on port 3000');
});