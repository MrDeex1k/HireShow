const db = require('../db-config');

const updateArtist = (id, artist) => {
  return db('artists').where({ artist_id: id }).update(artist).returning('*');
};

module.exports = {
  updateArtist,
};