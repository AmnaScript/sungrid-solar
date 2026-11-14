
import "dotenv/config";
import bcrypt from "bcrypt";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../config/db.js";

interface ExistingUser extends RowDataPacket {
    id: number;
}

async function bootstrap() {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL?.toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (
        !name ||
        !email ||
        !password ||
        password.length < 12
    ) {
        throw new Error(
            "Set ADMIN_NAME, ADMIN_EMAIL and a strong ADMIN_PASSWORD"
        );
    }

    const [users] = await db.execute<ExistingUser[]>(
        "SELECT id FROM users WHERE email = ?",
        [email]
    );

    if (users.length) {
        console.log("Account already exists. No changes made.");
        return;
    }

    const hash = await bcrypt.hash(password, 12);

    const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO users
     (name, email, password_hash, role)
     VALUES (?, ?, ?, 'admin')`,
        [name, email, hash]
    );

    console.log("Admin created with ID:", result.insertId);
}

bootstrap()
    .catch((error) => {
        console.error("Admin bootstrap failed:", error);
        process.exitCode = 1;
    })
    .finally(() => db.end());
