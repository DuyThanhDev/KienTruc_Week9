const express = require('express');

const app = express();
app.use(express.json());

// Sample data
let shipments = [
  { orderId: 1, status: 'pending' }
];

// Shipping endpoints
app.post('/ship-order', (req, res) => {
  const { orderId } = req.body;
  const shipment = shipments.find(s => s.orderId === orderId);

  if (!shipment) {
    shipments.push({ orderId, status: 'shipping' });
  } else {
    shipment.status = 'shipping';
  }

  res.json({ message: 'Order is being shipped' });
});

app.get('/shipments', (req, res) => {
  res.json(shipments);
});

app.listen(3001, () => {
  console.log('Server B running on port 3001');
});