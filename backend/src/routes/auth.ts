
import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../config/db.js";
import { requireRole } from "../middleware/auth.js";
import { rateLimit } from "express-rate-limit";

const router = Router();

interface UserRow extends RowDataPacket {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    role: "staff" | "admin";
}

const registerSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.email().max(255),
    password: z.string().min(8).max(72),
}).strict();

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
}).strict();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Too many login attempts. Try again later.",
    },
});

// Admin-only registration.
// Client cannot choose its own role.
router.post("/register", requireRole("admin"), async (req, res, next) => {
    try {
        const parsed = registerSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({
                message: "Invalid registration details",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { name, password } = parsed.data;
        const email = parsed.data.email.toLowerCase();

        const [existing] = await db.execute<UserRow[]>(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existing.length) {
            res.status(409).json({
                message: "Email is already registered",
            });
            return;
        }

        const hash = await bcrypt.hash(password, 12);

        const [result] = await db.execute<ResultSetHeader>(
            `INSERT INTO users
       (name, email, password_hash, role)
       VALUES (?, ?, ?, 'staff')`,
            [name, email, hash]
        );

        res.status(201).json({
            message: "Staff registered successfully",
            user: {
                id: result.insertId,
                name,
                email,
                role: "staff",
            },
        });
    } catch (error) {
        next(error);
    }
});

// Login
router.post("/login", loginLimiter, async (req, res, next) => {
    try {
        const parsed = loginSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({
                message: "Enter a valid email and password",
            });
            return;
        }

        const email = parsed.data.email.toLowerCase();

        const [rows] = await db.execute<UserRow[]>(
            `SELECT id, name, email, password_hash, role
       FROM users WHERE email = ?`,
            [email]
        );

        const user = rows[0];

        const validPassword = user
            ? await bcrypt.compare(
                parsed.data.password,
                user.password_hash
            )
            : false;

        if (!user || !validPassword) {
            res.status(401).json({
                message: "Invalid email or password",
            });
            return;
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            res.status(500).json({
                message: "Server configuration error",
            });
            return;
        }

        const token = jwt.sign(
            { role: user.role },
            secret,
            {
                algorithm: "HS256",
                subject: String(user.id),
                expiresIn: "2h",
            }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
