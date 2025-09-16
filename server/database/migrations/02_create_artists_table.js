exports.up = function(knex) 
{
  return knex.schema.createTable('artists', function(table) 
  {
    table.increments('artist_id').primary();
    table.integer('user_id').references('user_id').inTable('users').onDelete('CASCADE').unique();
    table.text('first_name').notNullable();
    table.text('last_name').notNullable();
    table.text('residence');
    table.string('country', 100);
    table.specificType('age', 'smallint');
    table.specificType('height', 'smallint');
    table.specificType('weight', 'smallint');
    table.specificType('hip', 'smallint');
    table.specificType('waist', 'smallint');
    table.specificType('cage', 'smallint');
    table.specificType('shoe_size', 'smallint');
    table.specificType('clothes_size', 'smallint');
    table.text('eyes_color');
    table.text('hair_color');
    table.specificType('experience_level', 'smallint');
    table.string('experience_info', 255);
    table.text('social_media_links');
    table.bigInteger('online_reach');
    table.text('bio');
    table.text('short_video');
    table.boolean('popularity_premium').defaultTo(true);
    table.string('artist_type', 10).notNullable().checkIn(['influencer', 'actor', 'model']);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');
    table.index('user_id');
    table.index('popularity_premium');
    table.index('artist_type');
    table.index('online_reach');
  }).then(() => knex.raw('ALTER TABLE artists ADD CONSTRAINT chk_experience_level_range CHECK (experience_level IS NULL OR (experience_level >= 1 AND experience_level <= 5))'));
};

exports.down = function(knex) 
{
  return knex.schema.dropTableIfExists('artists');
};
