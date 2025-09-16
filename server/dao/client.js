class Client {
  constructor(
    client_id,
    user_id,
    client_name,
    client_nip,
    subscription_type,
    subscription_expiry,
    created_at,
    updated_at
  ) {
    this.client_id = client_id;
    this.user_id = user_id;
    this.client_name = client_name;
    this.client_nip = client_nip;
    this.subscription_type = subscription_type;
    this.subscription_expiry = subscription_expiry;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = Client;
