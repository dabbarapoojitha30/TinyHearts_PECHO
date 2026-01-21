const express = require("express");
const cors = require("cors");
const pool = require("./db");
const fs = require("fs");
const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Create table if not exists
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

// ------------------ CREATE PATIENT ------------------
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
       VALUES (${fields.map((_, i)=>"$"+(i+1)).join(",")})`,
      fields.map(f=>p[f] || "")
    );

    res.json({status:"success"});
  } catch(err) {
    console.error(err);
    res.status(500).json({status:"error", message:err.message});
  }
});

// ------------------ GET ALL PATIENTS ------------------
app.get("/patients", async (req,res)=>{
  try{
    const r = await pool.query("SELECT patient_id,name FROM patients ORDER BY created_at DESC");
    res.json(r.rows);
  }catch(err){
    res.status(500).json({status:"error", message:err.message});
  }
});

// ------------------ GET SINGLE PATIENT ------------------
app.get("/patients/:id", async (req,res)=>{
  try{
    const r = await pool.query("SELECT * FROM patients WHERE patient_id=$1",[req.params.id]);
    if(!r.rows.length) return res.status(404).json({status:"error", message:"Patient not found"});
    res.json(r.rows[0]);
  }catch(err){
    res.status(500).json({status:"error", message:err.message});
  }
});

// ------------------ UPDATE PATIENT ------------------
app.put("/patients/:id", async (req,res)=>{
  try{
    const p = req.body;
    const fields = [
      "name","dob","age","sex","weight","diagnosis",
      "situs_loop","systemic_veins","pulmonary_veins","atria",
      "atrial_septum","av_valves","ventricles","ventricular_septum",
      "outflow_tracts","pulmonary_arteries","aortic_arch",
      "others_field","impression"
    ];

    await pool.query(
      `UPDATE patients SET ${fields.map((f,i)=>f+"=$"+(i+1)).join(",")} WHERE patient_id=$${fields.length+1}`,
      [...fields.map(f=>p[f] || ""), req.params.id]
    );

    res.json({status:"success"});
  }catch(err){
    res.status(500).json({status:"error", message:err.message});
  }
});

// ------------------ DELETE PATIENT ------------------
app.delete("/patients/:id", async (req,res)=>{
  try{
    await pool.query("DELETE FROM patients WHERE patient_id=$1",[req.params.id]);
    res.json({status:"success"});
  }catch(err){
    res.status(500).json({status:"error", message:err.message});
  }
});

// ------------------ GENERATE PDF ------------------
// ------------------ GENERATE PDF ------------------
app.post("/generate-pdf", async (req, res) => {
  try {
    let html = fs.readFileSync(path.join(__dirname, "public/report.html"), "utf8");

    const {
      name, age, date, sex, weight, diagnosis, situs_loop,
      systemic_veins, pulmonary_veins, atria, atrial_septum,
      av_valves, ventricles, ventricular_septum, outflow_tracts,
      pulmonary_arteries, aortic_arch, others_field, impression
    } = req.body;

    // Replace placeholders with actual values
    html = html
      .replace("{{name}}", name || "")
      .replace("{{age}}", age || "")
      .replace("{{date}}", date || "")
      .replace("{{sex}}", sex || "")
      .replace("{{weight}}", weight || "")
      .replace("{{diagnosis}}", diagnosis || "")
      .replace("{{situs_loop}}", situs_loop || "")
      .replace("{{systemic_veins}}", systemic_veins || "")
      .replace("{{pulmonary_veins}}", pulmonary_veins || "")
      .replace("{{atria}}", atria || "")
      .replace("{{atrial_septum}}", atrial_septum || "")
      .replace("{{av_valves}}", av_valves || "")
      .replace("{{ventricles}}", ventricles || "")
      .replace("{{ventricular_septum}}", ventricular_septum || "")
      .replace("{{outflow_tracts}}", outflow_tracts || "")
      .replace("{{pulmonary_arteries}}", pulmonary_arteries || "")
      .replace("{{aortic_arch}}", aortic_arch || "")
      .replace("{{others_field}}", others_field || "")
      .replace("{{impression}}", impression || "");

    // Inline your CSS
    const css = fs.readFileSync(path.join(__dirname, "public/style.css"), "utf8");
    html = html.replace('</head>', `<style>${css}</style></head>`);

    // Convert logos to base64
    const logoFile = fs.readFileSync(path.join(__dirname, 'public/logo.png'));
    const logoBase64 = `data:image/png;base64,${logoFile.toString('base64')}`;
    html = html.replace(/src="logo\.png"/g, `src="${logoBase64}"`);

    // Convert watermark to base64 (if same logo, you can reuse logoBase64)
    html = html.replace(/src="watermark\.png"/g, `src="${logoBase64}"`);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754 });

    // Set the content
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "30px", bottom: "30px", left: "40px", right: "40px" }
    });

    await browser.close();

    // Send PDF to client
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${name || 'TinyHeartsReport'}.pdf`
    });
    res.send(pdf);

  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

app.listen(process.env.PORT||5000, ()=>console.log(`✅ Server running on port ${process.env.PORT||5000}`));
