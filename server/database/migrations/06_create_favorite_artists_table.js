exports.up = function(knex)
{
  return knex.schema.createTable('favorite_artists', function(table)
  {
    table.increments('favorite_id').primary();
    table.integer('client_user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.integer('artist_id').notNullable().references('artist_id').inTable('artists').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['client_user_id','artist_id']);
    table.index('client_user_id');
    table.index('artist_id');
  });
};

exports.down = function(knex)
{
  return knex.schema.dropTableIfExists('favorite_artists');
};


