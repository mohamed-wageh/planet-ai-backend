// src/middlewares/admin.middleware.js

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin resources only.' 
    });
  }
};

module.exports = { isAdmin };