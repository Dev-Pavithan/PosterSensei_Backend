import axios from 'axios';
const API = 'http://localhost:5000/api';

async function e2e() {
  try {
    const userEmail = 'e2etest' + Date.now() + '@example.com';
    console.log('1. Registering new user:', userEmail);
    const regRes = await axios.post(API + '/users', { name: 'E2E Tester', email: userEmail, password: 'password123' });
    const userCookie = regRes.headers['set-cookie']?.join('; ');
    if (!userCookie) throw new Error('No cookie received on register');
    
    console.log('2. Fetching products to add to cart');
    const prodRes = await axios.get(API + '/products');
    const product = prodRes.data.products[0];
    if (!product) throw new Error('No products found in DB to test with');
    
    console.log('3. Placing order as user');
    const orderPayload = {
      orderItems: [{ title: product.title, qty: 1, image: product.imageUrl, price: product.price, product: product._id }],
      shippingAddress: { address: '123 Test St', city: 'Test City', postalCode: '123456', country: 'India' },
      paymentMethod: 'Cash on Delivery',
      deliveryMethod: 'post',
      totalPrice: product.price + 79,
      discount: 0,
      couponCode: ''
    };
    const orderRes = await axios.post(API + '/orders', orderPayload, {
      headers: { Cookie: userCookie }
    });
    const orderId = orderRes.data._id;
    console.log('Order successfully placed! ID:', orderId);
    
    console.log('4. Logging in as Admin');
    const adminRes = await axios.post(API + '/users/auth', { email: 'pavithanunenthiran29@gmail.com', password: '1234567890' });
    const adminCookie = adminRes.headers['set-cookie']?.join('; ');
    if (!adminCookie) throw new Error('No cookie received for Admin login');
    
    console.log('5. Admin fetching all orders to verify');
    const fetchOrdersRes = await axios.get(API + '/orders', {
      headers: { Cookie: adminCookie }
    });
    
    const found = fetchOrdersRes.data.find((o: any) => o._id === orderId);
    if (found) {
      console.log('SUCCESS! Admin successfully found the order placed by the new user.');
    } else {
      throw new Error('Order not found in Admin list!');
    }
  } catch (error: any) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

e2e();
