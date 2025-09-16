const db = require('../db-config');

const deleteUser = (id) => {
  return db('users').where({ user_id: id }).del();
};

module.exports = {
  deleteUser,
};