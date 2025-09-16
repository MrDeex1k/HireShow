const db = require('../db-config');

const updateUser = (id, user) => {
  return db('users').where({ user_id: id }).update(user).returning('*');
};

const updateUserApprovalStatus = async (userId, isApproved) => {
  const updateData = {
    is_approved: isApproved,
    updated_at: db.fn.now()
  };
  
  return db('users')
    .where({ user_id: userId })
    .update(updateData)
    .returning('*');
};

module.exports = {
  updateUser,
  updateUserApprovalStatus,
};