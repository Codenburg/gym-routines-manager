import bcrypt from 'bcrypt';

async function testBcrypt() {
  const password = 'nando123';
  const hash = await bcrypt.hash(password, 12);
  console.log('Hash:', hash);
  
  const isValid = await bcrypt.compare(password, hash);
  console.log('Valid:', isValid);
  
  // Now check the hash stored in DB
  const storedHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qiZSdooNBjVGcq';
  const isValid2 = await bcrypt.compare(password, storedHash);
  console.log('Valid against stored:', isValid2);
}

testBcrypt();
