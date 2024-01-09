const verifyPassword = (req, res, next) => {
  const correctPassword = process.env.APIPASSWORD; // Assuming PASSWORD is the environment variable storing your password
  if (!req.body.password || req.body.password !== correctPassword) {
    return res.status(401).json({ error: true, message: 'Unauthorized access' });
  }

  // If the password is correct, continue to the next middleware or route handler
  next();
};
module.exports = verifyPassword;
