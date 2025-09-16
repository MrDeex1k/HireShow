const db = require('../db-config');

const createClient = ({ user_id, client_name, client_nip, phone }) => {
  return db('users')
    .where({ user_id })
    .first()
    .then(user => {
      if (!user) {
        throw new Error('User nie istnieje');
      }
      return db('clients')
        .where({ user_id })
        .first()
        .then(client => {
          if (client) {
            throw new Error('Klient z tym user_id już istnieje.');
          }
          const updateUserPhone = phone && String(phone).trim() !== ''
            ? db('users').where({ user_id }).update({ phone: String(phone).trim() })
            : Promise.resolve();
          return updateUserPhone.then(() => {
            const clientInsert = { user_id, client_name, client_nip };
            return db('clients')
              .insert(clientInsert)
              .returning(['client_id', 'user_id']);
          });
        });
    })
    .then(rows => rows[0]); // zwraca utworzonego klienta
};

module.exports = {
  createClient,
};