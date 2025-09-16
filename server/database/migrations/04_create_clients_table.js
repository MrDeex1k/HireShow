exports.up = function(knex) 
{
  return knex.schema.createTable('clients', function(table) 
  {
    table.increments('client_id').primary();
    table.integer('user_id').references('user_id').inTable('users').onDelete('CASCADE').unique();
    table.text('client_name');
    table.text('client_nip');
    table.string('industry', 50);
    table.string('company_size', 10);
    table.string('contact_person', 100);
    table.string('website', 255);
    table.string('street', 100);
    table.string('building', 20);
    table.string('city', 100);
    table.string('postal_code', 7);
    table.text('description');
    table.string('subscription_type', 10).notNullable().checkIn(['free', 'basic', 'premium']).defaultTo('free');
    table.timestamp('subscription_expiry');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');
    table.index('user_id');
    table.index('subscription_type');
    table.index('subscription_expiry');
  });
};

exports.down = function(knex) 
{
  return knex.schema.dropTableIfExists('clients');
};
