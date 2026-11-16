
import { Router } from "express";
import type {
    RowDataPacket,
    ResultSetHeader,
} from "mysql2";
import { z } from "zod";

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

const statusSchema = z.object({
    status: z.enum([
        "Scheduled",
        "In Progress",
        "Completed",
        "Cancelled",
    ]),
}).strict();

// Existing Task 1 route - keep working
router.get(
    "/orders",
    requireRole("staff"),
    async (_req, res, next) => {
        try {
            const [orders] = await db.execute<OrderRow[]>(
                `SELECT id, customer_name, address,
                status, created_at
         FROM orders
         ORDER BY created_at DESC, id DESC`
            );

            res.status(200).json(orders);
        } catch (error) {
            next(error);
        }
    }
);

// Task 2: update order status and save audit log
router.patch(
    "/orders/:id/status",
    requireRole("staff"),
    async (req, res, next) => {
        const orderId = Number(req.params.id);
        const validation = statusSchema.safeParse(req.body);

        if (!Number.isSafeInteger(orderId) || orderId <= 0) {
            res.status(400).json({
                message: "Invalid order ID",
            });
            return;
        }

        if (!validation.success) {
            res.status(400).json({
                message: "Please select a valid order status",
            });
            return;
        }

        const staffId = res.locals.user?.id as number | undefined;

        if (!Number.isSafeInteger(staffId) || !staffId) {
            res.status(403).json({
                message: "Staff authorization required",
            });
            return;
        }

        let connection;

        try {
            connection = await db.getConnection();
            await connection.beginTransaction();

            // Lock the order to prevent conflicting updates.
            const [rows] = await connection.execute<OrderRow[]>(
                "SELECT * FROM orders WHERE id = ? FOR UPDATE",
                [orderId]
            );

            const order = rows[0];

            if (!order) {
                await connection.rollback();
                res.status(404).json({
                    message: "Order not found",
                });
                return;
            }

            const oldStatus = order.status;
            const newStatus = validation.data.status;

            if (oldStatus === newStatus) {
                await connection.rollback();
                res.status(400).json({
                    message: "Order already has this status",
                });
                return;
            }

            // 1. Update the actual order.
            await connection.execute<ResultSetHeader>(
                "UPDATE orders SET status = ? WHERE id = ?",
                [newStatus, orderId]
            );

            // 2. Save the change history.
            await connection.execute<ResultSetHeader>(
                `INSERT INTO order_logs
         (order_id, user_id, old_status, new_status)
         VALUES (?, ?, ?, ?)`,
                [orderId, staffId, oldStatus, newStatus]
            );

            // Both operations succeed or fail together.
            await connection.commit();

            res.status(200).json({
                message: "Order status updated successfully",
                order: {
                    ...order,
                    status: newStatus,
                },
                change: {
                    order_id: orderId,
                    old_status: oldStatus,
                    new_status: newStatus,
                    changed_by: staffId,
                },
            });
        } catch (error) {
            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error("Rollback failed:", rollbackError);
                }
            }

            next(error);
        } finally {
            connection?.release();
        }
    }
);

export default router;
