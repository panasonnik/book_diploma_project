import { getUserByEmail, getUserByUsername, getUserByEmailOrUsername, addUser } from '../models/userModel.js';
import { hashPassword, comparePassword, generateToken } from '../utils/authUtils.js';

export async function registerUser(req, res) {
    const { username, email, password } = req.body;

    try {
        const existingEmail = await getUserByEmail(email);
        if (existingEmail) {
            return res.status(400).send("Email already in use");
        }

        const existingUsername = await getUserByUsername(username);
        if (existingUsername) {
            return res.status(400).send("Username already in use");
        }

        const hashedPassword = hashPassword(password);
        await addUser(username, email, hashedPassword);

        res.status(201).send("User registered successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
}

export async function loginUser(req, res) {
    const { usernameOrEmail, password } = req.body;

    try {
        const user = await getUserByEmailOrUsername(usernameOrEmail);
        if (!user) {
            return res.status(404).send("Email/username not found");
        }

        const isPasswordValid = comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).send("Invalid credentials");
        }

        const token = generateToken(user.id);
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
}
