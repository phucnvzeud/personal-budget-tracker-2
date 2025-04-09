const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login API...');
    
    const response = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('Login failed!');
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

async function testStatus() {
  try {
    console.log('Testing status API...');
    
    const response = await axios.get('http://localhost:8080/api/status');
    
    console.log('Status API successful!');
    console.log('Status:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('Status API failed!');
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

async function main() {
  // First check if the server is running
  const statusOk = await testStatus();
  
  if (statusOk) {
    // Then test login
    await testLogin();
  } else {
    console.log('Server may not be running. Please start the server first.');
  }
}

// Run the tests
main(); 