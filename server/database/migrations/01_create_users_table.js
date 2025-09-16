exports.up = function(knex) 
{
  return knex.schema.createTable('users', function(table) 
  {
    table.increments('user_id').primary();
    table.text('email').notNullable().unique();
    table.text('password_hash').notNullable();
    table.string('role', 10).notNullable().checkIn(['artist', 'client', 'admin']);
    table.string('is_approved', 7).notNullable().checkIn(['YES', 'NO', 'WAITING']).defaultTo('WAITING');
    table.text('rejection_reason');
    table.text('phone');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');
    table.index('role');
    table.index('is_approved');
  });
};

exports.down = function(knex) 
{
  return knex.schema.dropTableIfExists('users');
};
