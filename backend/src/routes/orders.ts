
import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { db } from "../config/db.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

interface OrderRow extends RowDataPacket {
    id: number;
    customer_name: string;
    address: string;
    status: string;
    created_at: Date;
}

router.get(
    "/orders",
    requireRole("staff"),
    async (_req, res, next) => {
        try {
            const [orders] = await db.execute<OrderRow[]>(
                `SELECT id, customer_name, address,
                status, created_at
         FROM orders
         ORDER BY created_at DESC`
            );

            res.status(200).json(orders);
        } catch (error) {
            next(error);
        }
    }
);

export default router;
