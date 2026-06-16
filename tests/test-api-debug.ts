/* eslint-disable @typescript-eslint/no-explicit-any */
const TEST_USERNAME = process.env.TEST_LOGIN_USERNAME ?? "11111111";
const TEST_PASSWORD = process.env.TEST_LOGIN_PASSWORD ?? "nando123";

async function testLoginAPI() {
  try {
    console.log('Testing login API with user:', TEST_USERNAME);
    
    const response = await fetch('http://localhost:3000/api/auth/sign-in/username', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: TEST_USERNAME,
        password: TEST_PASSWORD
      })
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    // Check for session cookie
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      console.log('Cookies set:', cookies);
    }
    
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

testLoginAPI();
