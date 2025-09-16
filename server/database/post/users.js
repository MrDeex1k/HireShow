const db = require('../db-config');
const bcrypt = require('bcryptjs');

const createUser = async ({ email, password_hash, role }) => {
  const existingUser = await db('users')
    .where({ email })
    .first();
    
  if (existingUser) {
    throw new Error('Użytkownik o tym adresie email już istnieje.');
  }

  const hashedPassword = await bcrypt.hash(password_hash, 10);

  const result = await db('users')
    .insert({ email, password_hash: hashedPassword, role })
    .returning('user_id');
    
  return result[0].user_id;
};

module.exports = {
  createUser,
  addUser: createUser,
};