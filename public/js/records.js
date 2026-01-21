// ------------------- FETCH AND POPULATE TABLE -------------------
async function fetchPatients() {
    try {
        const res = await fetch("/patients");
        const patients = await res.json();
        const tbody = document.querySelector("#patientsTable tbody");
        tbody.innerHTML = "";

        patients.forEach(patient => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${patient.patient_id}</td>
                <td>${patient.name}</td>
                <td>
                    <button class="btn btn-sm btn-success me-1" onclick="downloadPatientPDF('${patient.patient_id}')">PDF</button>
                    <button class="btn btn-sm btn-primary me-1" onclick="editPatient('${patient.patient_id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePatient('${patient.patient_id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        alert("Error fetching patients: " + err.message);
    }
}

// ------------------- DOWNLOAD PDF -------------------
async function downloadPatientPDF(patientId) {
    try {
        const res = await fetch(`/patients/${patientId}`);
        if (!res.ok) { alert("Patient not found"); return; }

        const data = await res.json();

        const payload = {
            name: data.name,
            age: data.age,
            date: new Date().toLocaleDateString(),
            sex: data.sex,
            weight: data.weight,
            diagnosis: data.diagnosis,
            situs_loop: data.situs_loop,
            systemic_veins: data.systemic_veins,
            pulmonary_veins: data.pulmonary_veins,
            atria: data.atria,
            atrial_septum: data.atrial_septum,
            av_valves: data.av_valves,
            ventricles: data.ventricles,
            ventricular_septum: data.ventricular_septum,
            outflow_tracts: data.outflow_tracts,
            pulmonary_arteries: data.pulmonary_arteries,
            aortic_arch: data.aortic_arch,
            others_field: data.others_field,
            impression: data.impression
        };

        const pdfRes = await fetch("/generate-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!pdfRes.ok) throw new Error("PDF generation failed on server");

        const blob = await pdfRes.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${patientId}-TinyHeartsReport.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);

    } catch (err) {
        alert("Error generating PDF: " + err.message);
    }
}

// ------------------- EDIT PATIENT -------------------
function editPatient(patientId) {
    window.location.href = `index.html?update=${patientId}`;
}

// ------------------- DELETE PATIENT -------------------
async function deletePatient(patientId) {
    if (!confirm("Are you sure you want to delete this patient?")) return;

    try {
        const res = await fetch(`/patients/${patientId}`, { method: "DELETE" });
        const result = await res.json();
        if (result.status === "deleted") {
            alert("Patient deleted!");
            fetchPatients();
        } else {
            alert("Error deleting patient: " + result.message);
        }
    } catch (err) {
        alert("Server error: " + err.message);
    }
}

// ------------------- INITIAL LOAD -------------------
window.addEventListener("DOMContentLoaded", fetchPatients);
