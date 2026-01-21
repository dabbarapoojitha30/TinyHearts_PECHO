require("dotenv").config();
const { Pool } = require("pg");

// Automatically uses Render ENV in production, local .env in development
const db = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "YOUR_LOCAL_PASSWORD",
  database: process.env.DB_NAME || "pediatric_echo",
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

db.connect()
  .then(() => console.log("✅ Database connected"))
  .catch(err => console.error("❌ DB connection error:", err));

module.exports = db;
