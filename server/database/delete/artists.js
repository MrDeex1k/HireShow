const db = require('../db-config');

const deleteArtist = (id) => {
  return db('artists').where({ id }).del();
};

module.exports = {
  deleteArtist,
};