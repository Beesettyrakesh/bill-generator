import { hash as _hash } from 'bcryptjs';

async function hashPassword(): Promise<void> {
  const password = process.argv[2];
  if (!password) {
    console.error('Please provide a password to hash');
    process.exit(1);
  }

  const saltRounds = 10;
  const hash = await _hash(password, saltRounds);
  console.log(`Password: ${password} -> Hash: ${hash}`);
}

hashPassword();
