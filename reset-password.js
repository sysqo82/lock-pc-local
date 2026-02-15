#!/usr/bin/env node
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./database');

async function usage() {
  console.log('Usage: node reset-password.js <email> <newPassword>');
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) return usage();
  const [email, newPassword] = args;
  if (!email || !newPassword) return usage();

  try {
    await db.initDb();
  } catch (e) {
    console.error('Failed to init DB:', e.message || e);
    process.exit(2);
  }

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    const res = await db.query('UPDATE users SET password = $1 WHERE email = $2', [hash, email]);
    if (res.rowCount === 0) {
      console.error('No user found with email:', email);
      process.exit(3);
    }
    console.log(`Password updated for ${email}`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating password:', err && err.message ? err.message : err);
    process.exit(4);
  }
}

main();
