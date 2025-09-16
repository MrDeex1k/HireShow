class Artist 
{
  constructor(
    artist_id,
    user_id,
    first_name,
    last_name,
    residence,
    country,
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
    experience_level,
    experience_info,
    social_media_links,
    online_reach,
    bio,
    popularity_premium,
    artist_type,
    short_video,
    created_at,
    updated_at
  ) {
    this.artist_id = artist_id;
    this.user_id = user_id;
    this.first_name = first_name;
    this.last_name = last_name;
    this.residence = residence;
    this.country = country;
    this.age = age;
    this.height = height;
    this.weight = weight;
    this.hip = hip;
    this.waist = waist;
    this.cage = cage;
    this.shoe_size = shoe_size;
    this.clothes_size = clothes_size;
    this.eyes_color = eyes_color;
    this.hair_color = hair_color;
    this.experience_level = experience_level;
    this.experience_info = experience_info;
    this.social_media_links = social_media_links;
    this.online_reach = online_reach;
    this.bio = bio;
    this.popularity_premium = popularity_premium;
    this.artist_type = artist_type;
    this.short_video = short_video;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = Artist;