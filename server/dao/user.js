class User {
  constructor(user_id, email, password_hash, role, is_approved, rejection_reason, phone, created_at, updated_at) {
    this.user_id = user_id;
    this.email = email;
    this.password_hash = password_hash;
    this.role = role;
    this.is_approved = is_approved;
    this.rejection_reason = rejection_reason;
    this.phone = phone;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = User;