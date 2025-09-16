const log = require('../middleware/logger');
const bcrypt = require('bcryptjs');
const { createArtist: createArtistDB } = require('../database/post/artists');
const knex = require('../database/db-config');
const usersGet = require('../database/get/users');
const artistsGet = require('../database/get/artists');
const clientsGet = require('../database/get/clients');
const usersPut = require('../database/put/users');
const artistsPut = require('../database/put/artists');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const createArtist = async (req, res) => {
  const { user_id, phone, first_name, last_name, residence, country, age, height, weight, hip, waist, cage, shoe_size, clothes_size, eyes_color, hair_color, experience_info, social_media_links, online_reach, bio, artist_type, short_video } = req.body;

  // Podstawowa walidacja wymaganych pól
  if (!user_id || !first_name || !last_name || !artist_type || !phone || !residence || !country || !experience_info) 
  {
    log('CreateArtistAttemptFailed', 'details', 'Missing required fields');
    return res.status(400).json({ error: 'Wszystkie pola: imię, nazwisko, telefon, miejsce zamieszkania, kraj oraz experience_info są wymagane.' });
  }

  try 
  {
    log('CreateArtistAttempt', 'user_id', user_id);
    
    // Przygotuj dane artysty - wymagane pola
    const artistData = { 
      user_id, 
      phone: phone.trim(),
      first_name: first_name.trim(), 
      last_name: last_name.trim(), 
      residence: residence.trim(),
      country: country.trim(),
      artist_type 
    };
    
    // Walidacja experience_info max 255
    if (experience_info && experience_info.length > 255) {
      log('CreateArtistAttemptFailed', 'details', 'experience_info too long');
      return res.status(400).json({ error: 'experience_info nie może przekraczać 255 znaków.' });
    }
    artistData.experience_info = experience_info.trim();

    // Dodaj opcjonalne pola tylko jeśli są niepuste
    if (age !== undefined && age !== null && String(age).trim() !== '') artistData.age = parseInt(age, 10);
    if (height !== undefined && height !== null && String(height).trim() !== '') artistData.height = parseInt(height, 10);
    if (weight !== undefined && weight !== null && String(weight).trim() !== '') artistData.weight = parseInt(weight, 10);
    if (hip !== undefined && hip !== null && String(hip).trim() !== '') artistData.hip = parseInt(hip, 10);
    if (waist !== undefined && waist !== null && String(waist).trim() !== '') artistData.waist = parseInt(waist, 10);
    if (cage !== undefined && cage !== null && String(cage).trim() !== '') artistData.cage = parseInt(cage, 10);
    if (shoe_size !== undefined && shoe_size !== null && String(shoe_size).trim() !== '') artistData.shoe_size = parseInt(shoe_size, 10);
    if (clothes_size !== undefined && clothes_size !== null && String(clothes_size).trim() !== '') artistData.clothes_size = parseInt(clothes_size, 10);
    if (eyes_color && eyes_color.trim() !== '') artistData.eyes_color = eyes_color.trim();
    if (hair_color && hair_color.trim() !== '') artistData.hair_color = hair_color.trim();
    if (social_media_links && social_media_links.trim() !== '') artistData.social_media_links = social_media_links.trim();
    if (online_reach !== undefined && online_reach !== null) artistData.online_reach = online_reach;
    if (bio && bio.trim() !== '') artistData.bio = bio.trim();
    if (short_video && short_video.trim() !== '') artistData.short_video = short_video.trim();
    
    const newArtist = await createArtistDB(artistData);
    log('CreateArtistSuccess', 'artist_id', newArtist.artist_id);
    res.status(201).json({ message: 'Artist created successfully', artist: newArtist });
  } 
  catch (error) 
  {
    log('CreateArtistFailed', 'error', error.message);
    res.status(500).json({ error: 'Error creating artist', details: error.message });
  }
};

const updateArtist = async (req, res) => {
  const { user_id, password, phone, ...artistData } = req.body;

  if (!user_id || !password) 
  {
    log('UpdateArtistAttemptFailed', 'details', 'Missing user_id or password');
    return res.status(400).json({ error: 'user_id and password are required.' });
  }

  try 
  {
    log('UpdateArtistAttempt', 'user_id', user_id);

    if (req.auth && req.auth.role !== 'admin') 
    {
      if (String(req.auth.user_id) !== String(user_id)) 
      {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const user = await usersGet.getUserById(user_id);
    if (!user) 
    {
      log('UpdateArtistAuthFailed', 'user_id', user_id);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) 
    {
      log('UpdateArtistAuthFailed', 'user_id', user_id);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    let updatedPhone;
    if (phone) 
    {
      const updatedUser = await usersPut.updateUser(user_id, { phone });
      if (updatedUser && updatedUser.length > 0) 
      {
        updatedPhone = updatedUser[0].phone;
      }
      log('UserPhoneUpdateSuccess', 'user_id', user_id);
    }

    const artist = await artistsGet.getArtistByUserId(user_id);
    if (!artist) 
    {
      log('UpdateArtistNotFound', 'user_id', user_id);
      return res.status(404).json({ error: 'Artist not found for this user.' });
    }

    if (Object.prototype.hasOwnProperty.call(artistData, 'experience_level')) 
    {
      delete artistData.experience_level;
    }

    if (artistData.experience_info && artistData.experience_info.length > 255) 
    {
      log('UpdateArtistAttemptFailed', 'details', 'experience_info too long');
      return res.status(400).json({ error: 'experience_info nie może przekraczać 255 znaków.' });
    }

    const fieldsRequiringApproval = [
      'first_name','last_name','residence','country','age','height','weight','hip','waist','cage','shoe_size','clothes_size','eyes_color','hair_color','experience_info','social_media_links','online_reach','short_video','artist_type'
    ];
    const anyApprovalFieldPresent = fieldsRequiringApproval.some((f) => Object.prototype.hasOwnProperty.call(artistData, f));

    const updatedArtist = await artistsPut.updateArtist(artist.artist_id, artistData);
    log('UpdateArtistSuccess', 'artist_id', updatedArtist[0].artist_id);

    const responseData = { ...updatedArtist[0] };
    if (updatedPhone) 
    {
      responseData.phone = updatedPhone;
    }

    if (anyApprovalFieldPresent) 
    {
      await usersPut.updateUser(user_id, { is_approved: 'WAITING' });
    }
    
    res.status(200).json({ message: 'Artist updated successfully', artist: responseData });

  } catch (error) {
    log('UpdateArtistFailed', 'error', error.message);
    res.status(500).json({ error: 'Error updating artist', details: error.message });
  }
};

const getArtistByUserId = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) 
  {
    log('GetArtistByUserIdAttemptFailed', 'details', 'Missing user_id parameter');
    return res.status(400).json({ error: 'user_id parameter is required.' });
  }

  try 
  {
    log('GetArtistByUserIdAttempt', 'user_id', user_id);
    if (req.auth && req.auth.role === 'artist') 
    {
      if (String(req.auth.user_id) !== String(user_id)) 
      {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    const artist = await artistsGet.getArtistByUserId(user_id);
    
    log('GetArtistByUserIdSuccess', 'user_id', user_id);
    res.status(200).json({ 
      message: 'Artist retrieved successfully',
      artist: artist 
    });
  } 
  catch (error) 
  {
    log('GetArtistByUserIdFailed', 'error', error.message);
    if (error.message === 'Artysta nie znaleziony') 
    {
      return res.status(404).json({ error: 'Artist not found for this user' });
    }
    res.status(500).json({ error: 'Error retrieving artist', details: error.message });
  }
};

const getArtistByIdWithPhotos = async (req, res) => {
  const { artist_id } = req.params;

  if (!artist_id) 
  {
    log('GetArtistByIdWithPhotosFailed', 'details', 'Missing artist_id parameter');
    return res.status(400).json({ error: 'artist_id parameter is required.' });
  }

  try 
  {
    const artist = await artistsGet.getArtistWithPhotosById(parseInt(artist_id, 10));
    return res.status(200).json({ message: 'Artist details retrieved', artist });
  } 
  catch (error) 
  {
    if (error && error.message === 'Artysta nie znaleziony') {
      return res.status(404).json({ error: 'Artist not found' });
    }
    log('GetArtistByIdWithPhotosFailed', 'error', error.message);
    return res.status(500).json({ error: 'Error retrieving artist details', details: error.message });
  }
};

const getAllArtists = async (req, res) => {
  try 
  {
    log('GetAllArtistsAttempt', 'action', 'getAllArtists');
    const artists = await artistsGet.getAllArtists();
    
    log('GetAllArtistsSuccess', 'count', artists.length);
    res.status(200).json({ 
      message: 'Artists retrieved successfully',
      count: artists.length,
      artists: artists 
    });
  } 
  catch (error) 
  {
    log('GetAllArtistsFailed', 'error', error.message);
    res.status(500).json({ error: 'Error retrieving artists', details: error.message });
  }
};

const searchArtists = async (req, res) => {
  try 
  {
    log('SearchArtistsAttempt', 'query', JSON.stringify(req.query));

    const filters = {
      artist_type: req.query.artist_type,
      experience_min: req.query.experience_min || req.query.experience,
      location: req.query.location,
      age_min: req.query.age_min,
      age_max: req.query.age_max,
      height_min: req.query.height_min,
      height_max: req.query.height_max,
      weight_min: req.query.weight_min,
      weight_max: req.query.weight_max,
      hip_min: req.query.hip_min,
      hip_max: req.query.hip_max,
      waist_min: req.query.waist_min,
      waist_max: req.query.waist_max,
      cage_min: req.query.cage_min,
      cage_max: req.query.cage_max,
      shoe_size_min: req.query.shoe_size_min,
      shoe_size_max: req.query.shoe_size_max,
      clothes_size_min: req.query.clothes_size_min,
      clothes_size_max: req.query.clothes_size_max,
      online_reach_min: req.query.online_reach_min,
      online_reach_max: req.query.online_reach_max,
    };

    const artists = await artistsGet.searchArtists(filters);

    let subscriptionType = 'free';
    if (req.auth && req.auth.role === 'client') 
    {
      try 
      {
        const client = await clientsGet.getClientByUserId(req.auth.user_id);
        if (client && client.subscription_type) 
        {
          subscriptionType = client.subscription_type;
        }
      } 
      catch (_) 
      {

      }
    }

    const isPremiumClient = (req.auth && req.auth.role === 'admin')
      ? true
      : (subscriptionType && subscriptionType.toLowerCase() === 'premium');

    const result = artists.map((a) => ({
      artist_id: a.artist_id,
      name: `${a.first_name} ${a.last_name}`.trim(),
      type: a.artist_type,
      experience: a.experience_level || 0,
      location: a.residence || a.country || '',
      photo: a.primary_photo || null,
      isPremium: Boolean(a.popularity_premium),
      blur: !isPremiumClient && Boolean(a.popularity_premium),
    }));

    log('SearchArtistsSuccess', 'count', result.length);
    return res.status(200).json({
      message: 'Artists search successful',
      count: result.length,
      artists: result,
      client_subscription: subscriptionType,
    });
  } 
  catch (error) 
  {
    log('SearchArtistsFailed', 'error', error.message);
    return res.status(500).json({ error: 'Error searching artists', details: error.message });
  }
};

const updatePremiumStatus = async (req, res) => {
  const { artist_id, popularity_premium } = req.body;

  if (!artist_id || typeof popularity_premium !== 'boolean') 
  {
    log('UpdatePremiumStatusAttemptFailed', 'details', 'Missing required fields or invalid data type');
    return res.status(400).json({ error: 'artist_id and popularity_premium (boolean) are required.' });
  }

  try 
  {
    log('UpdatePremiumStatusAttempt', 'artist_id', artist_id);
    
    const artist = await artistsGet.getArtistById(artist_id);
    if (!artist) 
    {
      log('UpdatePremiumStatusFailed', 'details', 'Artist not found');
      return res.status(404).json({ error: 'Artist not found' });
    }

    const updatedArtist = await artistsPut.updateArtist(artist_id, { popularity_premium: popularity_premium });
    
    log('UpdatePremiumStatusSuccess', 'artist_id', artist_id);
    res.status(200).json({ 
      message: 'Premium status updated successfully',
      artist_id: artist_id,
      popularity_premium: popularity_premium
    });
  } 
  catch (error) 
  {
    log('UpdatePremiumStatusFailed', 'error', error.message);
    res.status(500).json({ error: 'Error updating premium status', details: error.message });
  }
};

const updateExperienceLevel = async (req, res) => {
  const { artist_id, user_id, experience_level } = req.body;

  if ((!artist_id && !user_id) || experience_level === undefined || experience_level === null) 
  {
    log('UpdateExperienceLevelAttemptFailed', 'details', 'Missing required fields');
    return res.status(400).json({ error: 'artist_id lub user_id oraz experience_level są wymagane.' });
  }

  const level = parseInt(experience_level, 10);
  if (Number.isNaN(level) || level < 1 || level > 5) 
  {
    log('UpdateExperienceLevelAttemptFailed', 'details', 'Invalid experience_level');
    return res.status(400).json({ error: 'experience_level musi być liczbą całkowitą z zakresu 1-5.' });
  }

  try 
  {
    let targetArtistId = artist_id;

    if (!targetArtistId) 
    {
      try 
      {
        const artist = await artistsGet.getArtistByUserId(user_id);
        if (!artist) 
        {
          log('UpdateExperienceLevelFailed', 'details', 'Artist not found by user_id');
          return res.status(404).json({ error: 'Artist not found for this user.' });
        }
        targetArtistId = artist.artist_id;
      } 
      catch (e) 
      {
        if (e && e.message === 'Artysta nie znaleziony') {
          log('UpdateExperienceLevelFailed', 'details', 'Artist not found by user_id');
          return res.status(404).json({ error: 'Artist not found for this user.' });
        }
        throw e;
      }
    } 
    else 
    {
      try 
      {
        const artist = await artistsGet.getArtistById(targetArtistId);
        if (!artist) 
        {
          log('UpdateExperienceLevelFailed', 'details', 'Artist not found by artist_id');
          return res.status(404).json({ error: 'Artist not found' });
        }
      } 
      catch (e) 
      {
        if (e && e.message === 'Artysta nie znaleziony') 
        {
          log('UpdateExperienceLevelFailed', 'details', 'Artist not found by artist_id');
          return res.status(404).json({ error: 'Artist not found' });
        }
        throw e;
      }
    }

    await artistsPut.updateArtist(targetArtistId, { experience_level: level });

    log('UpdateExperienceLevelSuccess', 'artist_id', targetArtistId);
    return res.status(200).json({
      message: 'Experience level updated successfully',
      artist_id: targetArtistId,
      experience_level: level,
    });
  } 
  catch (error) 
  {
    log('UpdateExperienceLevelFailed', 'error', error.message);
    return res.status(500).json({ error: 'Error updating experience level', details: error.message });
  }
};

const registerArtistFull = async (req, res) => {
  const { email, password, artist_type, first_name, last_name, phone, residence, country, experience_info, user_id } = req.body;

  if ((!email || !password) && !user_id) 
    {
    log('RegisterArtistFullFailed', 'details', 'Missing auth (email+password) or user_id');
    return res.status(400).json({ error: 'Podaj email+password lub user_id.' });
  }

  if (!artist_type || !first_name || !last_name || !phone || !residence || !country || !experience_info) 
  {
    log('RegisterArtistFullFailed', 'details', 'Missing required fields');
    return res.status(400).json({ error: 'Wszystkie wymagane pola muszą być wypełnione.' });
  }

  try 
  {
    await knex.transaction(async (trx) => {
      log('RegisterArtistFullAttempt', 'email', email);
      let newUserId = user_id ? parseInt(user_id, 10) : null;
      if (!newUserId) 
      {
        const existing = await trx('users').where({ email }).first();

        if (existing) 
        {
          throw new Error('Użytkownik o tym adresie email już istnieje.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const insertedUsers = await trx('users')
          .insert({ email, password_hash: hashedPassword, role: 'artist', phone: phone && String(phone).trim() ? String(phone).trim() : null })
          .returning(['user_id']);
        newUserId = insertedUsers[0].user_id;
      } 
      else 
      {
        await trx('users').where({ user_id: newUserId }).update({ phone: String(phone).trim() });
      }

      // Przygotuj dane artysty (walidowane wyżej) + opcjonalne pola
      const artistData = {
        user_id: newUserId,
        artist_type,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        residence: residence.trim(),
        country: country.trim(),
        experience_info: String(experience_info).trim(),
      };
      const {
        age,
        height,
        weight,
        hip,
        waist,
        cage,
        shoe_size,
        clothes_size,
        eyes_color,
        hair_color,
        social_media_links,
        online_reach,
        bio,
        short_video,
      } = req.body;
      if (age !== undefined && age !== null && String(age).trim() !== '') artistData.age = parseInt(age, 10);
      if (height !== undefined && height !== null && String(height).trim() !== '') artistData.height = parseInt(height, 10);
      if (weight !== undefined && weight !== null && String(weight).trim() !== '') artistData.weight = parseInt(weight, 10);
      if (hip !== undefined && hip !== null && String(hip).trim() !== '') artistData.hip = parseInt(hip, 10);
      if (waist !== undefined && waist !== null && String(waist).trim() !== '') artistData.waist = parseInt(waist, 10);
      if (cage !== undefined && cage !== null && String(cage).trim() !== '') artistData.cage = parseInt(cage, 10);
      if (shoe_size !== undefined && shoe_size !== null && String(shoe_size).trim() !== '') artistData.shoe_size = parseInt(shoe_size, 10);
      if (clothes_size !== undefined && clothes_size !== null && String(clothes_size).trim() !== '') artistData.clothes_size = parseInt(clothes_size, 10);
      if (eyes_color && String(eyes_color).trim() !== '') artistData.eyes_color = String(eyes_color).trim();
      if (hair_color && String(hair_color).trim() !== '') artistData.hair_color = String(hair_color).trim();
      if (social_media_links && String(social_media_links).trim() !== '') artistData.social_media_links = String(social_media_links).trim();
      if (online_reach !== undefined && online_reach !== null && String(online_reach).trim() !== '') artistData.online_reach = parseInt(online_reach, 10);
      if (bio && String(bio).trim() !== '') artistData.bio = String(bio).trim();
      if (short_video && String(short_video).trim() !== '') artistData.short_video = String(short_video).trim();

      const insertedArtists = await trx('artists')
        .insert(artistData)
        .returning(['artist_id']);

      log('RegisterArtistFullSuccess', 'user_id', newUserId);
      res.status(201).json({
        message: 'Artist registered successfully',
        userId: newUserId,
        artistId: insertedArtists[0].artist_id,
      });
    });
  } 
  catch (error) 
  {
    log('RegisterArtistFullFailed', 'error', error.message);

    if (error.message && error.message.includes('already exists')) 
    {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    return res.status(500).json({ error: 'Error registering artist', details: error.message });
  }
};

const uploadArtistPhotos = async (req, res) => {
  try 
  {
    if (!req.auth || req.auth.role !== 'artist') 
    {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const userId = req.auth.user_id;

    let artist;
    try 
    {
      artist = await artistsGet.getArtistByUserId(userId);
    } 
    catch (e) 
    {
      return res.status(404).json({ error: 'Artist not found for this user' });
    }

    if (!req.files || req.files.length === 0) 
    {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) 
    {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const orderString = req.body.photo_order || '';
    let order = [];
    if (orderString) 
    {
      order = orderString.split(',').map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n));
    }

    const filesOrdered = order.length === req.files.length
      ? order.map((idx) => req.files[idx]).filter(Boolean)
      : req.files;

    const existing = await knex('artist_photos').where({ artist_id: artist.artist_id }).orderBy('position', 'desc');
    const existingCount = existing.length;
    const availableSlots = Math.max(0, 5 - existingCount);

    if (availableSlots <= 0) 
    {
      return res.status(400).json({ error: 'Photo limit reached (max 5)' });
    }
    const filesLimited = filesOrdered.slice(0, availableSlots);

    const maxWidth = 4000;
    const maxHeight = 4000;

    const saved = [];
    const basePosition = existing && existing.length > 0 && existing[0].position ? parseInt(existing[0].position, 10) : 0;
    const hasExisting = (existing && existing.length > 0);
    
    for (let i = 0; i < filesLimited.length; i += 1) 
    {
      const file = filesLimited[i];
      if (file.size > 5 * 1024 * 1024) 
      {
        return res.status(400).json({ error: 'File too large (max 5MB)' });
      }

      const meta = await sharp(file.buffer).metadata();

      if ((meta.width || 0) > maxWidth || (meta.height || 0) > maxHeight) 
      {
        return res.status(400).json({ error: 'Image dimensions exceed 4000x4000' });
      }

      const position = basePosition + i + 1;
      const ts = Date.now();
      const filename = `artist_${userId}_${position}_${ts}.webp`;
      const outPath = path.join(uploadsDir, filename);
      await sharp(file.buffer).webp({ quality: 85, effort: 4 }).toFile(outPath);
      const publicPath = `/uploads/${filename}`;

      const inserted = await knex('artist_photos').insert({
        artist_id: artist.artist_id,
        photo_path: publicPath,
        is_primary: !hasExisting && i === 0,
        position,
      }).returning(['photo_id', 'photo_path', 'position', 'is_primary']);
      saved.push(inserted[0]);
    }

    await usersPut.updateUser(userId, { is_approved: 'WAITING' });
    return res.status(201).json({ message: 'Photos uploaded', photos: saved });
  } 
  catch (error) 
{
    log('UploadArtistPhotosFailed', 'error', error.message);
    return res.status(500).json({ error: 'Error uploading photos', details: error.message });
  }
};

const deleteArtistPhoto = async (req, res) => {
  try 
  {
    if (!req.auth || req.auth.role !== 'artist') 
    {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userId = req.auth.user_id;
    const { photo_id } = req.params;
    const artist = await artistsGet.getArtistByUserId(userId);
    const photo = await knex('artist_photos').where({ photo_id }).first();
    
    if (!photo || photo.artist_id !== artist.artist_id) 
    {
      return res.status(404).json({ error: 'Photo not found' });
    }

    try 
    {
      const fsPath = path.join(__dirname, '..', photo.photo_path.replace('/uploads', 'uploads'));
      
      if (fs.existsSync(fsPath)) 
      {
        fs.unlinkSync(fsPath);
      }
    } 
    catch (_) {}
    
    await knex('artist_photos').where({ photo_id }).delete();
    return res.status(200).json({ message: 'Photo deleted', photo_id });
  } 
  catch (error) 
  {
    log('DeleteArtistPhotoFailed', 'error', error.message);
    return res.status(500).json({ error: 'Error deleting photo', details: error.message });
  }
};

const updateArtistPhotosOrder = async (req, res) => {
  try {
    if (!req.auth || req.auth.role !== 'artist') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const userId = req.auth.user_id;
    const { order } = req.body;
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: 'Order array is required' });
    }
    const artist = await artistsGet.getArtistByUserId(userId);
    const photos = await knex('artist_photos').where({ artist_id: artist.artist_id }).orderBy('photo_id', 'asc');
    const owned = new Set(photos.map(p => String(p.photo_id)));
    for (let i = 0; i < order.length; i += 1) {
      const pid = String(order[i]);
      if (!owned.has(pid)) {
        return res.status(400).json({ error: 'Invalid photo in order list' });
      }
    }

    for (let i = 0; i < order.length; i += 1) 
    {
      await knex('artist_photos').where({ photo_id: order[i] }).update({ position: i + 1, is_primary: i === 0 });
    }

    return res.status(200).json({ message: 'Order updated' });
  } 
  catch (error) 
  {
    log('UpdateArtistPhotosOrderFailed', 'error', error.message);
    return res.status(500).json({ error: 'Error updating order', details: error.message });
  }
};

const uploadArtistPhotosRegistration = async (req, res) => {
  try {
    const { artist_id: artistIdFromBody } = req.body;
    const artistId = parseInt(artistIdFromBody, 10);
    
    if (!artistId || Number.isNaN(artistId)) {
      return res.status(400).json({ error: 'artist_id is required' });
    }
    
    const artist = await artistsGet.getArtistById(artistId);
    
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const orderString = req.body.photo_order || '';
    let order = [];
    
    if (orderString) {
      order = orderString.split(',').map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n));
    }
    
    const filesOrdered = order.length === req.files.length
      ? order.map((idx) => req.files[idx]).filter(Boolean)
      : req.files;
      
    const existing = await knex('artist_photos').where({ artist_id: artist.artist_id }).orderBy('position', 'desc');
    const existingCount = existing.length;
    const availableSlots = Math.max(0, 5 - existingCount);
    if (availableSlots <= 0) {
      return res.status(400).json({ error: 'Photo limit reached (max 5)' });
    }
    const filesLimited = filesOrdered.slice(0, availableSlots);

    const maxWidth = 4000;
    const maxHeight = 4000;
    const basePosition = existing && existing.length > 0 && existing[0].position ? parseInt(existing[0].position, 10) : 0;
    const hasExisting = (existing && existing.length > 0);
    const saved = [];
    for (let i = 0; i < filesLimited.length; i += 1) {
      const file = filesLimited[i];
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large (max 5MB)' });
      }
      
      const meta = await sharp(file.buffer).metadata();
      if ((meta.width || 0) > maxWidth || (meta.height || 0) > maxHeight) {
        return res.status(400).json({ error: 'Image dimensions exceed 4000x4000' });
      }
      
      const position = basePosition + i + 1;
      const ts = Date.now();
      const filename = `artist_${artist.user_id}_${position}_${ts}.webp`;
      const outPath = path.join(uploadsDir, filename);
      await sharp(file.buffer).webp({ quality: 85, effort: 4 }).toFile(outPath);
      const publicPath = `/uploads/${filename}`;
      const inserted = await knex('artist_photos').insert({
        artist_id: artist.artist_id,
        photo_path: publicPath,
        is_primary: !hasExisting && i === 0,
        position,
      }).returning(['photo_id', 'photo_path', 'position', 'is_primary']);
      saved.push(inserted[0]);
    }
    await usersPut.updateUser(artist.user_id, { is_approved: 'WAITING' });
    return res.status(201).json({ message: 'Photos uploaded', photos: saved });
  } catch (error) {
    log('UploadArtistPhotosRegistrationFailed', 'error', error.message);
    return res.status(500).json({ error: 'Error uploading photos', details: error.message });
  }
};

module.exports = {
  createArtist,
  updateArtist,
  getArtistByUserId,
  getAllArtists,
  updatePremiumStatus,
  updateExperienceLevel,
  registerArtistFull,
  uploadArtistPhotos,
  deleteArtistPhoto,
  updateArtistPhotosOrder,
  uploadArtistPhotosRegistration,
  searchArtists,
  getArtistByIdWithPhotos,
};