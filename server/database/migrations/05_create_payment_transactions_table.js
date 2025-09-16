exports.up = function(knex) 
{
  return knex.schema.createTable('payment_transactions', function(table) 
  {
    table.increments('transaction_id').primary();
    table.integer('client_id').references('client_id').inTable('clients').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.string('transaction_status', 20).checkIn(['pending', 'completed', 'failed']);
    table.timestamp('transaction_date').defaultTo(knex.fn.now());
    table.string('external_transaction_id', 100);
    table.index('client_id');
    table.index('transaction_status');
    table.index('transaction_date');
  });
};

exports.down = function(knex) 
{
  return knex.schema.dropTableIfExists('payment_transactions');
};
