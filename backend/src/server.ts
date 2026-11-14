
import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";

import { testDatabaseConnection } from "./config/db.js";

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(helmet());
app.use(cors({
    origin: "http://localhost:5173",
}));
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (_req, res) => {
    res.status(200).json({
        message: "SunGrid Solar API is running!",
    });
});

async function startServer() {
    try {
        await testDatabaseConnection();

        app.listen(PORT, () => {
            console.log(
                `Server running at http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
}

startServer();
