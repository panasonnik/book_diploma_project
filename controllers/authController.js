import { getUserByEmail, getUserByUsername, getUserByEmailOrUsername, addUser, getUsers } from '../models/userModel.js';
import { hashPassword, comparePassword, generateToken } from '../utils/authUtils.js';


export async function allUsers(req, res) {
    try {
        const users = await getUsers();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
}

export async function registerUser(req, res) {
    const { username, email, password } = req.body;

    try {
        const existingUsername = await getUserByUsername(username);
        if (existingUsername) {
            return res.status(400).send("Username already in use");
        }

        const existingEmail = await getUserByEmail(email);
        if (existingEmail) {
            return res.status(400).send("Email already in use");
        }

        const hashedPassword = hashPassword(password);
        const user = await addUser(username, email, hashedPassword);
        const token = generateToken(user.user_id);
        res.cookie('token', token, {
            httpOnly: true,       // Makes the cookie inaccessible to JavaScript
            secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS in production
            maxAge: 60 * 60 * 1000, // 1 hour expiration time
            sameSite: 'Strict',    // Prevent CSRF attacks
        });

        // Redirect the user to the homepage
        res.status(201).redirect('/home');
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

        const token = generateToken(user.user_id);
        res.setHeader('Authorization', `Bearer ${token}`);
        res.status(201).redirect('/home');
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
}

export async function logoutUser(req, res) {
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
}
