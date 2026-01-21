require("dotenv").config(); // loads local .env in development
const { Pool } = require("pg");

const db = new Pool({
  host: process.env.DB_HOST,         // Use Render DB host in production
  user: process.env.DB_USER,         // Render DB user
  password: process.env.DB_PASSWORD, // Render DB password
  database: process.env.DB_NAME,     // Render DB name
  port: process.env.DB_PORT || 5432, // default port
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

db.connect()
  .then(() => console.log("✅ Database connected"))
  .catch(err => console.error("❌ DB connection error:", err));

module.exports = db;
