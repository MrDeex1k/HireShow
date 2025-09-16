exports.up = function(knex) 
{
  return knex.schema.createTable('artist_photos', function(table) 
  {
    table.increments('photo_id').primary();
    table.integer('artist_id').references('artist_id').inTable('artists').onDelete('CASCADE');
    table.string('photo_path', 255).notNullable();
    table.specificType('position', 'smallint');
    table.boolean('is_primary').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index('artist_id');
    table.index('is_primary');
    table.index('position');
  });
};

exports.down = function(knex) 
{
  return knex.schema.dropTableIfExists('artist_photos');
};
