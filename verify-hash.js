import { compare, hash as _hash } from 'bcrypt';

async function verifyHash() {
  const password = 'demo123';
  const hash = '$2b$10$zPZYeL9MJ0sE0Q5biJQX8uGksQwKgP1wLhKwHR6VgRHFVLUOgQZ2W';
  
  try {
    const isMatch = await compare(password, hash);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log(`Match: ${isMatch}`);
    
    // Generate a new hash for verification
    const newHash = await _hash(password, 10);
    console.log(`New hash: ${newHash}`);
    const newMatch = await compare(password, newHash);
    console.log(`New match: ${newMatch}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyHash();
