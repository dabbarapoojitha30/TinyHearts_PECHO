// ------------------ GENERATE PDF ------------------
app.post("/generate-pdf", async (req, res) => {
  try {
    const puppeteer = require('puppeteer');

    // Load HTML template
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

    // Inline CSS
    const css = fs.readFileSync(path.join(__dirname, "public/style.css"), "utf8");
    html = html.replace('</head>', `<style>${css}</style></head>`);

    // Convert logos to base64
    const logoFile = fs.readFileSync(path.join(__dirname, 'public/logo.png'));
    const logoBase64 = `data:image/png;base64,${logoFile.toString('base64')}`;
    html = html.replace(/src="logo\.png"/g, `src="${logoBase64}"`);
    html = html.replace(/src="watermark\.png"/g, `src="${logoBase64}"`);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754 });

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
