const db = require('../database');
const log = require('../middleware/logger');
const bcrypt = require('bcryptjs');
const usersGet = require('../database/get/users');
const clientsGet = require('../database/get/clients');
const clientsPut = require('../database/put/clients');
const usersPut = require('../database/put/users');
const knex = require('../database/db-config');
const artistsGet = require('../database/get/artists');

const createClient = async (req, res) => {
  const { user_id, client_name, client_nip, phone } = req.body;

  if (!user_id || !client_name) 
  {
    log('CreateClientAttemptFailed', 'details', 'Missing required fields');
    return res.status(400).json({ error: 'user_id and client_name are required.' });
  }

  try 
  {
    log('CreateClientAttempt', 'user_id', user_id);
    const clientData = { user_id, client_name, client_nip };

    if (client_nip !== undefined && client_nip !== null && String(client_nip).trim() !== '') {
      const normalizedNip = String(client_nip).replace(/\D/g, '');
      if (normalizedNip.length !== 10) {
        log('CreateClientAttemptFailed', 'details', 'Invalid client_nip format');
        return res.status(400).json({ error: 'client_nip must contain exactly 10 digits.' });
      }
      clientData.client_nip = normalizedNip;
    }

    const newClient = await db.clients.create(clientData);
    log('CreateClientSuccess', 'client_id', newClient.client_id);
    res.status(201).json({ message: 'Client created successfully', client: newClient });
  } 
  catch (error) 
  {
    log('CreateClientFailed', 'error', error.message);
    res.status(500).json({ error: 'Error creating client', details: error.message });
  }
};

const updateClient = async (req, res) => {
  const { user_id, password, phone, ...clientData } = req.body;

  if (!user_id || !password) {
    log('UpdateClientAttemptFailed', 'details', 'Missing user_id or password');
    return res.status(400).json({ error: 'user_id and password are required.' });
  }

  try 
  {
    log('UpdateClientAttempt', 'user_id', user_id);

    if (req.auth && req.auth.role !== 'admin') {
      if (String(req.auth.user_id) !== String(user_id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    if (req.auth && req.auth.role !== 'admin') {
      if (String(req.auth.user_id) !== String(user_id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const user = await usersGet.getUserById(user_id);
    if (!user) {
      log('UpdateClientAuthFailed', 'user_id', user_id);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      log('UpdateClientAuthFailed', 'user_id', user_id);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const client = await clientsGet.getClientByUserId(user_id);
    if (!client) 
    {
      log('UpdateClientNotFound', 'user_id', user_id);
      return res.status(404).json({ error: 'Client not found for this user.' });
    }

    if (clientData.client_nip !== undefined && clientData.client_nip !== null && String(clientData.client_nip).trim() !== '') {
      const normalizedNip = String(clientData.client_nip).replace(/\D/g, '');
      if (normalizedNip.length !== 10) {
        log('UpdateClientAttemptFailed', 'details', 'Invalid client_nip format');
        return res.status(400).json({ error: 'client_nip must contain exactly 10 digits.' });
      }
      clientData.client_nip = normalizedNip;
    }

    let updatedPhone;
    if (phone) {
      const updatedUser = await usersPut.updateUser(user_id, { phone });
      if (updatedUser && updatedUser.length > 0) {
        updatedPhone = updatedUser[0].phone;
      }
      log('UserPhoneUpdateSuccess', 'user_id', user_id);
    }

    const upsertData = { ...clientData };
    const allowedFields = ['client_name','client_nip','industry','company_size','contact_person','website','street','building','city','postal_code','description','subscription_type'];
    Object.keys(upsertData).forEach((key) => {
      if (!allowedFields.includes(key)) delete upsertData[key];
    });

    const fieldsRequiringApproval = ['client_name','client_nip','industry','company_size','contact_person','website','street','building','city','postal_code','description','subscription_type'];
    const anyApprovalFieldPresent = fieldsRequiringApproval.some((f) => Object.prototype.hasOwnProperty.call(upsertData, f));

    const updatedClient = await clientsPut.updateClient(client.client_id, upsertData);
    log('UpdateClientSuccess', 'client_id', updatedClient[0].client_id);

    if (anyApprovalFieldPresent) {
      await usersPut.updateUser(user_id, { is_approved: 'WAITING' });
      log('UserApprovalStatusSetToWaiting', 'user_id', user_id);
    }

    const responseData = { ...updatedClient[0] };
    if (updatedPhone) responseData.phone = updatedPhone;
    res.status(200).json({ message: 'Client updated successfully', client: responseData });

  } 
  catch (error) 
  {
    log('UpdateClientFailed', 'error', error.message);
    res.status(500).json({ error: 'Error updating client', details: error.message });
  }
};

const getClientByUserId = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    log('GetClientByUserIdAttemptFailed', 'details', 'Missing user_id parameter');
    return res.status(400).json({ error: 'user_id parameter is required.' });
  }

  try {
    log('GetClientByUserIdAttempt', 'user_id', user_id);
    
    if (req.auth && req.auth.role === 'client') {
      if (String(req.auth.user_id) !== String(user_id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    
    if (req.auth && req.auth.role === 'client') {
      if (String(req.auth.user_id) !== String(user_id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    const client = await clientsGet.getClientByUserId(user_id);
    
    log('GetClientByUserIdSuccess', 'user_id', user_id);
    res.status(200).json({ 
      message: 'Client retrieved successfully',
      client: client 
    });
  } catch (error) {
    log('GetClientByUserIdFailed', 'error', error.message);
    if (error.message === 'Klient nie znaleziony') {
      return res.status(404).json({ error: 'Client not found for this user' });
    }
    res.status(500).json({ error: 'Error retrieving client', details: error.message });
  }
};

const getAllClients = async (req, res) => {
  try {
    log('GetAllClientsAttempt', 'action', 'getAllClients');
    const clients = await clientsGet.getAllClients();
    
    log('GetAllClientsSuccess', 'count', clients.length);
    res.status(200).json({ 
      message: 'Clients retrieved successfully',
      count: clients.length,
      clients: clients 
    });
  } catch (error) {
    log('GetAllClientsFailed', 'error', error.message);
    res.status(500).json({ error: 'Error retrieving clients', details: error.message });
  }
};

const registerClientFull = async (req, res) => {
  const { email, password, client_name, client_nip, phone } = req.body;

  if (!email || !password || !client_name) {
    log('RegisterClientFullFailed', 'details', 'Missing required fields');
    return res.status(400).json({ error: 'email, password i client_name są wymagane.' });
  }

  try {
    await knex.transaction(async (trx) => {
      log('RegisterClientFullAttempt', 'email', email);

      const existing = await trx('users').where({ email }).first();
      if (existing) {
        throw new Error('Użytkownik o tym adresie email już istnieje.');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      let normalizedNip;
      if (client_nip !== undefined && client_nip !== null && String(client_nip).trim() !== '') {
        normalizedNip = String(client_nip).replace(/\D/g, '');
        if (normalizedNip.length !== 10) {
          throw new Error('client_nip must contain exactly 10 digits.');
        }
      }

      const insertedUsers = await trx('users')
        .insert({ email, password_hash: hashedPassword, role: 'client', phone: phone && String(phone).trim() ? String(phone).trim() : null })
        .returning(['user_id']);
      const newUserId = insertedUsers[0].user_id;

      const clientInsert = { user_id: newUserId, client_name: client_name.trim() };
      if (normalizedNip) clientInsert.client_nip = normalizedNip;

      const insertedClients = await trx('clients')
        .insert(clientInsert)
        .returning(['client_id']);

      log('RegisterClientFullSuccess', 'user_id', newUserId);
      res.status(201).json({
        message: 'Client registered successfully',
        userId: newUserId,
        clientId: insertedClients[0].client_id,
      });
    });
  } catch (error) {
    log('RegisterClientFullFailed', 'error', error.message);
    if (error.message && error.message.includes('already exists')) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    if (error.message && error.message.includes('client_nip')) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error registering client', details: error.message });
  }
};

const addFavoriteArtist = async (req, res) => {
  try {
    if (!req.auth || req.auth.role !== 'client') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const clientUserId = req.auth.user_id;
    const { artist_id } = req.body;
    const artistId = parseInt(artist_id, 10);
    if (!artistId || Number.isNaN(artistId)) {
      return res.status(400).json({ error: 'artist_id is required' });
    }

    await artistsGet.getArtistById(artistId);

    await knex('favorite_artists')
      .insert({ client_user_id: clientUserId, artist_id: artistId })
      .onConflict(['client_user_id', 'artist_id']).ignore();

    return res.status(201).json({ message: 'Added to favorites', artist_id: artistId });
  } catch (error) {
    return res.status(500).json({ error: 'Error adding to favorites', details: error.message });
  }
};

const removeFavoriteArtist = async (req, res) => {
  try {
    if (!req.auth || req.auth.role !== 'client') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const clientUserId = req.auth.user_id;
    const { artist_id } = req.params;
    const artistId = parseInt(artist_id, 10);
    if (!artistId || Number.isNaN(artistId)) {
      return res.status(400).json({ error: 'artist_id is required' });
    }
    const del = await knex('favorite_artists')
      .where({ client_user_id: clientUserId, artist_id: artistId })
      .del();
    if (del === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }
    return res.status(200).json({ message: 'Removed from favorites', artist_id: artistId });
  } catch (error) {
    return res.status(500).json({ error: 'Error removing from favorites', details: error.message });
  }
};

const listFavoriteArtists = async (req, res) => {
  try {
    if (!req.auth || req.auth.role !== 'client') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const clientUserId = req.auth.user_id;
    const rows = await knex('favorite_artists as f')
      .join('artists as a', 'a.artist_id', 'f.artist_id')
      .select(
        'a.artist_id',
        'a.first_name',
        'a.last_name',
        'a.artist_type',
        'a.residence',
        'a.country',
        'a.experience_level',
        'a.popularity_premium'
      )
      .where('f.client_user_id', clientUserId)
      .orderBy('f.created_at', 'desc');

    const withPhotos = await Promise.all(rows.map(async (a) => {
      const p = await knex('artist_photos')
        .where({ artist_id: a.artist_id })
        .orderBy([{ column: 'is_primary', order: 'desc' }, { column: 'position', order: 'asc' }, { column: 'photo_id', order: 'asc' }])
        .first();
      return {
        artist_id: a.artist_id,
        name: `${a.first_name || ''} ${a.last_name || ''}`.trim(),
        type: a.artist_type,
        location: a.residence || a.country || '',
        experience: a.experience_level || 0,
        isPremium: Boolean(a.popularity_premium),
        photo: p ? p.photo_path : null,
      };
    }));

    return res.status(200).json({ message: 'Favorites retrieved', count: withPhotos.length, artists: withPhotos });
  } catch (error) {
    return res.status(500).json({ error: 'Error retrieving favorites', details: error.message });
  }
};

module.exports = 
{
  createClient,
  updateClient,
  getClientByUserId,
  getAllClients,
  registerClientFull,
  addFavoriteArtist,
  removeFavoriteArtist,
  listFavoriteArtists,
};