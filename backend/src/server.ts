
import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";

import { testDatabaseConnection } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import orderRoutes from "./routes/orders.js";

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.disable("x-powered-by");
app.use(helmet());


const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(cors({
    origin: allowedOrigins,
}));


app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (_req, res) => {
    res.status(200).json({
        message: "SunGrid Solar API is running!",
    });
});

app.use("/api", authRoutes);
app.use("/api", orderRoutes);

app.use((
    _error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
) => {
    console.error("Internal API error");
    res.status(500).json({
        message: "Internal server error",
    });
});

async function startServer() {
    try {
        if (!process.env.JWT_SECRET ||
            process.env.JWT_SECRET.length < 32) {
            throw new Error("Configure a strong JWT_SECRET");
        }

        await testDatabaseConnection();

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
}

startServer();
