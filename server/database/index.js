const db = require('./db-config');

const artistsPost = require('./post/artists');
const clientsPost = require('./post/clients');
const usersPost = require('./post/users');

const artistsGet = require('./get/artists');
const clientsGet = require('./get/clients');
const usersGet = require('./get/users');

const artistsPut = require('./put/artists');
const clientsPut = require('./put/clients');
const usersPut = require('./put/users');

const artistsDelete = require('./delete/artists');
const clientsDelete = require('./delete/clients');
const usersDelete = require('./delete/users');

const database = {
  artists: {
    create: artistsPost.createArtist,
    getAll: artistsGet.getAllArtists,
    getById: artistsGet.getArtistById,
    getByUserId: artistsGet.getArtistByUserId,
    update: artistsPut.updateArtist,
    delete: artistsDelete.deleteArtist,
  },
  clients: {
    create: clientsPost.createClient,
    getAll: clientsGet.getAllClients,
    getByUserId: clientsGet.getClientByUserId,
    update: clientsPut.updateClient,
    delete: clientsDelete.deleteClient,
  },
  users: {
    create: usersPost.addUser,
    login: usersGet.loginUser,
    getById: usersGet.getUserById,
    getByEmail: usersGet.getUserByEmail,
    getPending: usersGet.getPendingUsers,
    getRejectedUsers: usersGet.getRejectedUsers,
    getDetailsWithRelatedData: usersGet.getUserDetailsWithRelatedData,
    update: usersPut.updateUser,
    updateApprovalStatus: usersPut.updateUserApprovalStatus,
    delete: usersDelete.deleteUser,
  },
};

module.exports = database;