require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const pool = require("./db"); // your PostgreSQL pool

const app = express();

// ------------------ MIDDLEWARE ------------------
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ------------------ CREATE TABLE IF NOT EXISTS ------------------
pool.query(`
CREATE TABLE IF NOT EXISTS patients(
  patient_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100),
  dob DATE,
  age INT,
  sex VARCHAR(10),
  weight FLOAT,
  diagnosis TEXT,
  situs_loop TEXT,
  systemic_veins TEXT,
  pulmonary_veins TEXT,
  atria TEXT,
  atrial_septum TEXT,
  av_valves TEXT,
  ventricles TEXT,
  ventricular_septum TEXT,
  outflow_tracts TEXT,
  pulmonary_arteries TEXT,
  aortic_arch TEXT,
  others_field TEXT,
  impression TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
`).catch(console.error);

// ------------------ CRUD ROUTES ------------------

// Create or Update patient
app.post("/patients", async (req, res) => {
  try {
    const p = req.body;
    const fields = [
      "patient_id","name","dob","age","sex","weight","diagnosis",
      "situs_loop","systemic_veins","pulmonary_veins","atria",
      "atrial_septum","av_valves","ventricles","ventricular_septum",
      "outflow_tracts","pulmonary_arteries","aortic_arch",
      "others_field","impression"
    ];

    await pool.query(
      `INSERT INTO patients (${fields.join(",")})
       VALUES (${fields.map((_, i) => "$" + (i + 1)).join(",")})
       ON CONFLICT (patient_id) DO UPDATE SET
       ${fields.slice(1).map(f => `${f} = EXCLUDED.${f}`).join(",")}`,
      fields.map(f => p[f] || "")
    );

    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all patients
app.get("/patients", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT patient_id, name FROM patients ORDER BY created_at DESC"
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single patient
app.get("/patients/:id", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT * FROM patients WHERE patient_id=$1",
      [req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: "Patient not found" });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete patient
app.delete("/patients/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM patients WHERE patient_id=$1", [req.params.id]);
    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ PDF GENERATION ------------------
app.post("/generate-pdf", async (req, res) => {
  try {
    let html = fs.readFileSync(path.join(__dirname, "public/report.html"), "utf8");

    // Replace template fields
    for (const key in req.body) {
      html = html.replace(new RegExp(`{{${key}}}`, "g"), req.body[key] || "");
    }

    const css = fs.readFileSync(path.join(__dirname, "public/style.css"), "utf8");
    html = html.replace("</head>", `<style>${css}</style></head>`);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: process.env.CHROME_PATH || undefined
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.send(pdf);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
