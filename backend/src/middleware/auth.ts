
import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import { db } from "../config/db.js";

type Role = "staff" | "admin";

interface StaffRow extends RowDataPacket {
    id: number;
    role: Role;
}

interface StaffToken extends JwtPayload {
    role: Role;
}

export const requireRole = (allowedRole: Role): RequestHandler =>
    async (req, res, next) => {
        const header = req.headers.authorization;

        if (!header?.startsWith("Bearer ")) {
            res.status(403).json({
                message: "Valid staff token required",
            });
            return;
        }

        const token = header.slice(7);
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            res.status(500).json({
                message: "Server configuration error",
            });
            return;
        }

        try {
            const decoded = jwt.verify(token, secret, {
                algorithms: ["HS256"],
            }) as StaffToken;

            const id = Number(decoded.sub);

            if (
                !Number.isSafeInteger(id) ||
                id <= 0 ||
                decoded.role !== allowedRole
            ) {
                res.status(403).json({
                    message: "Access denied",
                });
                return;
            }

            const [rows] = await db.execute<StaffRow[]>(
                "SELECT id, role FROM users WHERE id = ?",
                [id]
            );

            const user = rows[0];

            if (
                !user ||
                user.role !== allowedRole ||
                user.role !== decoded.role
            ) {
                res.status(403).json({
                    message: "Access denied",
                });
                return;
            }

            res.locals.user = {
                id: user.id,
                role: user.role,
            };

            next();
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                res.status(403).json({
                    message: "Invalid or expired token",
                });
                return;
            }

            next(error);
        }
    };
