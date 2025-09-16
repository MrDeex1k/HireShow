const db = require('../db-config');

const loginUser = async (email, password_hash) => {
  const user = await db('users')
    .where({ email, password_hash })
    .first();
  if (!user) {
    throw new Error('Dane są nieprawidłowe');
  }
  return {
    user_id: user.user_id,
    is_approved: user.is_approved,
    role: user.role,
  };
};

const getUserById = async (id) => {
  const user = await db('users')
    .where({ user_id: id })
    .first();
  if (!user) 
  {
    throw new Error('Użytkownik nie znaleziony');
  }
  return user;
};

const getUserByEmail = async (email) => {
  const user = await db('users')
    .where({ email })
    .first();
  return user;
};

const getPendingUsers = async () => {
  const users = await db('users')
    .where({ is_approved: 'WAITING' })
    .select('user_id', 'email', 'role', 'phone', 'created_at')
    .orderBy('created_at', 'desc');
  return users;
};

const getRejectedUsers = async () => {
  const users = await db('users')
    .where({ is_approved: 'NO' })
    .select('user_id', 'email', 'role', 'phone', 'created_at', 'updated_at')
    .orderBy('updated_at', 'desc');
  return users;
};

const getUserDetailsWithRelatedData = async (userId) => {
  const user = await db('users')
    .where({ user_id: userId })
    .first();
  
  if (!user) {
    throw new Error('Użytkownik nie znaleziony');
  }

  let relatedData = {};
  
  if (user.role === 'artist') {
    const artistData = await db('artists')
      .where({ user_id: userId })
      .first();
    
    if (artistData) {
      const photos = await db('artist_photos')
        .where({ artist_id: artistData.artist_id })
        .select('photo_path');
      
      relatedData = {
        ...artistData,
        photos: photos.map(p => p.photo_path)
      };
    }
  } else if (user.role === 'client') {
    const clientData = await db('clients')
      .where({ user_id: userId })
      .first();
    
    if (clientData) {
      relatedData = clientData;
    }
  }

  return {
    ...user,
    relatedData
  };
};

module.exports = 
{
  getUserById,
  getUserByEmail,
  loginUser,
  getPendingUsers,
  getRejectedUsers,
  getUserDetailsWithRelatedData,
};