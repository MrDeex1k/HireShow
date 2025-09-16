const db = require('../db-config');

const getAllArtists = () => {
  return db('artists').select('*');
};

// Wyszukiwanie artystów z filtrami
const searchArtists = async (filters) => {
  const q = db('artists as a')
    .select(
      'a.artist_id',
      'a.user_id',
      'a.first_name',
      'a.last_name',
      'a.residence',
      'a.country',
      'a.age',
      'a.height',
      'a.weight',
      'a.hip',
      'a.waist',
      'a.cage',
      'a.shoe_size',
      'a.clothes_size',
      'a.eyes_color',
      'a.hair_color',
      'a.experience_level',
      'a.experience_info',
      'a.online_reach',
      'a.bio',
      'a.popularity_premium',
      'a.artist_type',
      'a.short_video',
    )
    .select(
      db.raw(`(
        select ap.photo_path from artist_photos ap
        where ap.artist_id = a.artist_id
        order by ap.is_primary desc, ap.position asc, ap.photo_id asc
        limit 1
      ) as primary_photo`)
    );

  // Filtr typu artysty
  if (filters && filters.artist_type) {
    q.where('a.artist_type', String(filters.artist_type).trim());
  }

  // Filtr doświadczenia (co najmniej)
  if (filters && filters.experience_min) {
    const minExp = parseInt(filters.experience_min, 10);
    if (!Number.isNaN(minExp) && minExp > 0) {
      q.where('a.experience_level', '>=', minExp);
    }
  }

  // Filtry lokalizacji (miasto i/lub kraj)
  if (filters && filters.location) {
    const like = `%${String(filters.location).trim()}%`;
    // Używamy ILIKE dla Postgresa; dla innych DB może wymagać dostosowania
    q.andWhere(function() {
      this.where('a.residence', 'ilike', like).orWhere('a.country', 'ilike', like);
    });
  }

  // Funkcja pomocnicza do zakresów numerycznych
  const applyRange = (column, minVal, maxVal) => {
    if (minVal !== undefined && minVal !== null && String(minVal).trim() !== '') {
      const v = parseInt(minVal, 10);
      if (!Number.isNaN(v)) q.where(`a.${column}`, '>=', v);
    }
    if (maxVal !== undefined && maxVal !== null && String(maxVal).trim() !== '') {
      const v = parseInt(maxVal, 10);
      if (!Number.isNaN(v)) q.where(`a.${column}`, '<=', v);
    }
  };

  // Zakresy dla atrybutów fizycznych
  applyRange('age', filters?.age_min, filters?.age_max);
  applyRange('height', filters?.height_min, filters?.height_max);
  applyRange('weight', filters?.weight_min, filters?.weight_max);
  applyRange('hip', filters?.hip_min, filters?.hip_max);
  applyRange('waist', filters?.waist_min, filters?.waist_max);
  applyRange('cage', filters?.cage_min, filters?.cage_max);
  applyRange('shoe_size', filters?.shoe_size_min, filters?.shoe_size_max);
  applyRange('clothes_size', filters?.clothes_size_min, filters?.clothes_size_max);

  // Zasięg online
  applyRange('online_reach', filters?.online_reach_min, filters?.online_reach_max);

  q.orderBy('a.created_at', 'desc');

  return q;
};

const getArtistByUserId = async (user_id) => {
  const artist = await db('artists')
    .where({ user_id })
    .first();
  if (!artist) 
  {
    throw new Error('Artysta nie znaleziony');
  }
  const photos = await db('artist_photos')
    .where({ artist_id: artist.artist_id })
    .orderBy([{ column: 'position', order: 'asc' }, { column: 'photo_id', order: 'asc' }]);
  return {
    artist_id: artist.artist_id,
    user_id: artist.user_id,
    first_name: artist.first_name,
    last_name: artist.last_name,
    residence: artist.residence,
    country: artist.country,
    age: artist.age,
    height: artist.height,
    weight: artist.weight,
    hip: artist.hip,
    waist: artist.waist,
    cage: artist.cage,
    shoe_size: artist.shoe_size,
    clothes_size: artist.clothes_size,
    eyes_color: artist.eyes_color,
    hair_color: artist.hair_color,
    experience_level: artist.experience_level,
    experience_info: artist.experience_info,
    social_media_links: artist.social_media_links,
    online_reach: artist.online_reach,
    bio: artist.bio,
    short_video: artist.short_video,
    popularity_premium: artist.popularity_premium,
    artist_type: artist.artist_type,
    created_at: artist.created_at,
    updated_at: artist.updated_at,
    photos,
  };
};

const getArtistById = async (artist_id) => {
  const artist = await db('artists')
    .where({ artist_id })
    .first();
  if (!artist) 
  {
    throw new Error('Artysta nie znaleziony');
  }
  return artist;
};

// Pobranie artysty po artist_id wraz ze zdjęciami
const getArtistWithPhotosById = async (artist_id) => {
  const artist = await getArtistById(artist_id);
  const photos = await db('artist_photos')
    .where({ artist_id })
    .orderBy([{ column: 'position', order: 'asc' }, { column: 'photo_id', order: 'asc' }]);
  return {
    artist_id: artist.artist_id,
    user_id: artist.user_id,
    first_name: artist.first_name,
    last_name: artist.last_name,
    residence: artist.residence,
    country: artist.country,
    age: artist.age,
    height: artist.height,
    weight: artist.weight,
    hip: artist.hip,
    waist: artist.waist,
    cage: artist.cage,
    shoe_size: artist.shoe_size,
    clothes_size: artist.clothes_size,
    eyes_color: artist.eyes_color,
    hair_color: artist.hair_color,
    experience_level: artist.experience_level,
    experience_info: artist.experience_info,
    social_media_links: artist.social_media_links,
    online_reach: artist.online_reach,
    bio: artist.bio,
    short_video: artist.short_video,
    popularity_premium: artist.popularity_premium,
    artist_type: artist.artist_type,
    created_at: artist.created_at,
    updated_at: artist.updated_at,
    photos,
  };
};

module.exports = {
  getAllArtists,
  searchArtists,
  getArtistByUserId,
  getArtistById,
  getArtistWithPhotosById,
};