const axios = require('axios');

async function run() {
  try {
    const api = axios.create({ baseURL: 'http://localhost:5000/api' });

    console.log("Registering user");
    const regRes = await api.post('/auth/register', {
      name: 'Test',
      email: 'test' + Date.now() + '@example.com',
      password: 'password123'
    });
    
    const token = regRes.data.token;
    console.log("Got token", token);

    console.log("Adding payment method");
    const res = await api.post('/payments', {
      name: 'Test card',
      type: 'creditcard',
      fee: 1.5,
      speed: 7,
      security: 8,
      availability: 9,
      rewards: 5,
      reliability: 7
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

run();
