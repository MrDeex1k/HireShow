const db = require('../db-config');

const createArtist = (data) => {
  const { user_id, phone, first_name, last_name, residence, country, age, height, weight, hip, waist, cage, shoe_size, clothes_size, eyes_color, hair_color, experience_info, social_media_links, online_reach, bio, artist_type, short_video } = data;
  
  return db('users')
    .where({ user_id })
    .first()
    .then(user => {
      if (!user) {
        throw new Error('User nie istnieje');
      }
      return db('artists')
        .where({ user_id })
        .first()
        .then(artist => {
          if (artist) {
            throw new Error('Artysta z tym user_id już istnieje.');
          }

          return db('users')
            .where({ user_id })
            .update({ phone });
        });
    })
    .then(() => {
      const artistInsertData = { 
        user_id, 
        first_name, 
        last_name, 
        residence,
        country,
        artist_type 
      };
      
      if (age !== undefined && age !== null && String(age).trim() !== '') artistInsertData.age = parseInt(age, 10);
      if (height !== undefined && height !== null && String(height).trim() !== '') artistInsertData.height = parseInt(height, 10);
      if (weight !== undefined && weight !== null && String(weight).trim() !== '') artistInsertData.weight = parseInt(weight, 10);
      if (hip !== undefined && hip !== null && String(hip).trim() !== '') artistInsertData.hip = parseInt(hip, 10);
      if (waist !== undefined && waist !== null && String(waist).trim() !== '') artistInsertData.waist = parseInt(waist, 10);
      if (cage !== undefined && cage !== null && String(cage).trim() !== '') artistInsertData.cage = parseInt(cage, 10);
      if (shoe_size !== undefined && shoe_size !== null && String(shoe_size).trim() !== '') artistInsertData.shoe_size = parseInt(shoe_size, 10);
      if (clothes_size !== undefined && clothes_size !== null && String(clothes_size).trim() !== '') artistInsertData.clothes_size = parseInt(clothes_size, 10);
      if (eyes_color && eyes_color.trim() !== '') artistInsertData.eyes_color = eyes_color;
      if (hair_color && hair_color.trim() !== '') artistInsertData.hair_color = hair_color;
      if (experience_info && experience_info.trim() !== '') artistInsertData.experience_info = experience_info;
      if (social_media_links && social_media_links.trim() !== '') artistInsertData.social_media_links = social_media_links;
      if (online_reach !== undefined && online_reach !== null) artistInsertData.online_reach = online_reach;
      if (bio && bio.trim() !== '') artistInsertData.bio = bio;
      if (short_video && short_video.trim() !== '') artistInsertData.short_video = short_video;

      return db('artists')
        .insert(artistInsertData)
        .returning(['artist_id', 'user_id']);
    })
    .then(rows => rows[0]);
};

module.exports = 
{
  createArtist,
};