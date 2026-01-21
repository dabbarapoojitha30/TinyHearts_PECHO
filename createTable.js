const pool = require("./db");

async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Table 'patients' created successfully!");
  } catch (err) {
    console.error("❌ Error creating table:", err.message);
  } finally {
    pool.end();
  }
}

createTable();
