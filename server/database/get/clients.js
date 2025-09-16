const db = require('../db-config');

const getAllClients = () => {
  return db('clients').select('*');
};

const getClientByUserId = async (user_id) => {
  const client = await db('clients')
    .where({ user_id })
    .first();
  if (!client) {
    throw new Error('Klient nie znaleziony');
  }
  // Pobierz telefon z tabeli users
  let phone;
  try {
    const userRow = await db('users').where({ user_id }).first();
    phone = userRow ? userRow.phone : null;
  } catch (e) {
    phone = null;
  }

  return {
    client_id: client.client_id,
    user_id: client.user_id,
    client_name: client.client_name,
    client_nip: client.client_nip,
    industry: client.industry,
    company_size: client.company_size,
    contact_person: client.contact_person,
    website: client.website,
    phone: phone,
    street: client.street,
    building: client.building,
    city: client.city,
    postal_code: client.postal_code,
    description: client.description,
    subscription_type: client.subscription_type,
    subscription_expiry: client.subscription_expiry,
    created_at: client.created_at,
    updated_at: client.updated_at,
  };
};

module.exports = {
  getAllClients,
  getClientByUserId
};