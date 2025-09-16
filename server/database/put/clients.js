const db = require('../db-config');

const updateClient = (id, client) => {
  return db('clients').where({ client_id: id }).update(client).returning('*');
};

module.exports = {
  updateClient,
};