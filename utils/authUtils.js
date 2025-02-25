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
