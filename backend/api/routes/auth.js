const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// REGISTER USER
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // Check if user exists
        db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
            if (results.length > 0) {
                return res.status(400).json({ message: "Email already exists" });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Insert new user
            db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                [name, email, hashedPassword], (err, result) => {
                    if (err) return res.status(500).json({ message: "Database error" });
                    res.status(201).json({ message: "User registered successfully" });
                });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// LOGIN USER
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
            if (results.length === 0) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            const user = results[0];

            // Compare passwords
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            // Generate JWT Token
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

            res.status(200).json({ message: "Login successful", token });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;