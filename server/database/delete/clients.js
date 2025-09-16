const db = require('../db-config');

const deleteClient = (id) => {
  return db('clients').where({ id }).del();
};

module.exports = {
  deleteClient,
};