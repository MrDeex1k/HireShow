const db = require('../database');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');

const logFilePath = path.join(__dirname, '..', 'logs.txt');

const log = (event, entity, id) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}-${event}-${entity}:${id}\n`;

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
};

const createUser = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) 
  {
    log('CreateUserAttemptFailed', 'details', 'Missing required fields');
    return res.status(400).json({ error: 'Email, password, and role are required.' });
  }

  try 
  {
    log('CreateUserAttempt', 'email', email);
    const userId = await db.users.create({ email, password_hash: password, role });
    log('CreateUserSuccess', 'user_id', userId);
    res.status(201).json({ message: 'User created successfully', userId });
  } 
  catch (error) 
  {
    log('CreateUserFailed', 'error', error.message);
    res.status(500).json({ error: 'Error creating user', details: error.message });
  }
};

const updatePassword = async (req, res) => {
  const { user_id, old_password, new_password } = req.body;

  if (!user_id || !old_password || !new_password) {
    log('UpdatePasswordAttemptFailed', 'details', 'Missing required fields');
    return res.status(400).json({ error: 'user_id, old_password, and new_password are required.' });
  }

  try {
    log('UpdatePasswordAttempt', 'user_id', user_id);
    const user = await db.users.getById(user_id);

    if (!user) {
      log('UpdatePasswordFailed', 'user_id', user_id, 'User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    const isOldPasswordValid = await bcrypt.compare(old_password, user.password_hash);
    if (!isOldPasswordValid) {
      log('UpdatePasswordFailed', 'user_id', user_id, 'Incorrect old password');
      return res.status(401).json({ error: 'Incorrect old password' });
    }

    const hashedNewPassword = await bcrypt.hash(new_password, 10);
    
    await db.users.update(user_id, { password_hash: hashedNewPassword });
    log('UpdatePasswordSuccess', 'user_id', user_id);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    log('UpdatePasswordFailed', 'error', error.message);
    res.status(500).json({ error: 'Error updating password', details: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    log('LoginAttemptFailed', 'details', 'Missing required fields');
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    log('LoginAttempt', 'email', email);
    
    const user = await db.users.getByEmail(email);
    
    if (!user) {
      log('LoginFailed', 'email', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      log('LoginFailed', 'email', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_approved !== 'YES') {
      log('LoginFailed', 'email', email, 'User not approved');
      return res.status(403).json({ 
        error: 'Account not approved',
        user: {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
          is_approved: user.is_approved
        }
      });
    }

    const tokenPayload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role
    };

    const token = generateToken(tokenPayload);

    log('LoginSuccess', 'user_id', user.user_id);
    
    const responseData = {
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        is_approved: user.is_approved
      }
    };

    if (user.role === 'artist') {
      if (db.artists && typeof db.artists.getByUserId === 'function') {
        const artist = await db.artists.getByUserId(user.user_id);
        if (artist && artist.first_name) {
          responseData.user.first_name = artist.first_name;
        }
      }
    } else if (user.role === 'client') {
      if (db.clients && typeof db.clients.getByUserId === 'function') {
        try {
          const client = await db.clients.getByUserId(user.user_id);
          if (client && client.client_name) {
            responseData.user.client_name = client.client_name;
          }
        } catch (clientError) {
          log('LoginFailed', 'email', email, 'Client data not found');
          return res.status(404).json({ error: 'Client profile not found' });
        }
      }
    }

    res.status(200).json(responseData);
  } catch (error) {
    log('LoginFailed', 'error', error.message);
    res.status(500).json({ error: 'Error during login', details: error.message });
  }
};

const getUserById = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    log('GetUserByIdAttemptFailed', 'details', 'Missing user_id parameter');
    return res.status(400).json({ error: 'user_id parameter is required.' });
  }

  try {
    log('GetUserByIdAttempt', 'user_id', user_id);
    const user = await db.users.getById(user_id);
    
    if (!user) {
      log('GetUserByIdFailed', 'user_id', user_id);
      return res.status(404).json({ error: 'User not found' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    
    log('GetUserByIdSuccess', 'user_id', user_id);
    res.status(200).json({ 
      message: 'User retrieved successfully',
      user: userWithoutPassword 
    });
  } catch (error) {
    log('GetUserByIdFailed', 'error', error.message);
    res.status(500).json({ error: 'Error retrieving user', details: error.message });
  }
};

const getPendingUsers = async (req, res) => {
  try {
    log('GetPendingUsersAttempt', 'admin', 'request');
    const pendingUsers = await db.users.getPending();
    
    log('GetPendingUsersSuccess', 'count', pendingUsers.length);
    res.status(200).json({ 
      message: 'Pending users retrieved successfully',
      users: pendingUsers 
    });
  } catch (error) {
    log('GetPendingUsersFailed', 'error', error.message);
    res.status(500).json({ error: 'Error retrieving pending users', details: error.message });
  }
};

const getRejectedUsers = async (req, res) => {
  try {
    log('GetRejectedUsersAttempt', 'admin', 'request');
    const rejectedUsers = await db.users.getRejectedUsers();
    
    log('GetRejectedUsersSuccess', 'count', rejectedUsers.length);
    res.status(200).json({ 
      message: 'Rejected users retrieved successfully',
      users: rejectedUsers 
    });
  } catch (error) {
    log('GetRejectedUsersFailed', 'error', error.message);
    res.status(500).json({ error: 'Error retrieving rejected users', details: error.message });
  }
};

const getUserDetails = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    log('GetUserDetailsAttemptFailed', 'details', 'Missing user_id parameter');
    return res.status(400).json({ error: 'user_id parameter is required.' });
  }

  try {
    log('GetUserDetailsAttempt', 'user_id', user_id);
    const userDetails = await db.users.getDetailsWithRelatedData(user_id);
    
    // Usuń wrażliwe dane z odpowiedzi
    const { password_hash, ...userWithoutPassword } = userDetails;
    
    log('GetUserDetailsSuccess', 'user_id', user_id);
    res.status(200).json({ 
      message: 'User details retrieved successfully',
      user: userWithoutPassword 
    });
  } catch (error) {
    log('GetUserDetailsFailed', 'error', error.message);
    res.status(500).json({ error: 'Error retrieving user details', details: error.message });
  }
};

const updateUserApprovalStatus = async (req, res) => {
  const { user_id } = req.params;
  const { action } = req.body;

  if (!user_id || !action) {
    log('UpdateApprovalStatusAttemptFailed', 'details', 'Missing required fields');
    return res.status(400).json({ error: 'user_id and action are required.' });
  }

  if (!['approve', 'reject', 'reactivate'].includes(action)) {
    log('UpdateApprovalStatusAttemptFailed', 'details', 'Invalid action');
    return res.status(400).json({ error: 'Action must be "approve", "reject", or "reactivate".' });
  }

  try {
    log('UpdateApprovalStatusAttempt', 'user_id', user_id);
    
    if (action === 'approve') {
      const user = await db.users.getById(user_id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (user.role === 'artist') {
        const artist = await db.artists.getByUserId(user_id).catch(() => null);
        if (!artist) {
          return res.status(400).json({ error: 'Artist profile not found' });
        }
        const level = artist.experience_level;
        if (!level || Number.isNaN(parseInt(level, 10)) || parseInt(level, 10) < 1 || parseInt(level, 10) > 5) {
          return res.status(400).json({ error: 'Set experience_level (1-5) before approving artist account' });
        }
      }
    }

    let isApproved;
    if (action === 'approve') {
      isApproved = 'YES';
    } else if (action === 'reject') {
      isApproved = 'NO';
    } else if (action === 'reactivate') {
      isApproved = 'WAITING';
    }
    
    await db.users.updateApprovalStatus(user_id, isApproved);
    
    log('UpdateApprovalStatusSuccess', 'user_id', user_id);
    res.status(200).json({ 
      message: `User ${action}d successfully`,
      user_id: user_id,
      status: isApproved
    });
  } catch (error) {
    log('UpdateApprovalStatusFailed', 'error', error.message);
    res.status(500).json({ error: 'Error updating user approval status', details: error.message });
  }
};

module.exports = {
  createUser,
  updatePassword,
  loginUser,
  getUserById,
  getPendingUsers,
  getRejectedUsers,
  getUserDetails,
  updateUserApprovalStatus,
};