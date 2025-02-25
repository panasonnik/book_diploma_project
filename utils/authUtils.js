import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export function hashPassword (password) {
  return bcrypt.hashSync(password, 10); 
}

export function comparePassword (enteredPassword, hashedPassword) {
  return bcrypt.compareSync(enteredPassword, hashedPassword);
}

export function generateToken (userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '3h' });
};

export function setCookie(res, token) {
  return res.cookie('token', token, {
    httpOnly: true,      
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 60 * 60 * 1000, // 1 hour
    sameSite: 'Strict',
  });
}