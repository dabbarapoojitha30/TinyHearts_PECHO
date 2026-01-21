// ------------------- LIVE DATE -------------------
document.getElementById('currentDate').innerText = new Date().toLocaleDateString();

// ------------------- AUTO-CALCULATE AGE -------------------
const dobInput = document.getElementById('dob');
const ageInput = document.getElementById('age');
const patientIdInput = document.getElementById('patientId');

dobInput.addEventListener('change', () => {
    const dob = new Date(dobInput.value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    ageInput.value = age >= 0 ? age : '';
});

// ------------------- TOGGLE "OTHERS" TEXTAREA -------------------
const toggleOthers = (selectId, textareaId) => {
    const sel = document.getElementById(selectId);
    const ta = document.getElementById(textareaId);
    sel.addEventListener('change', () => {
        ta.classList.toggle('d-none', sel.value !== 'Others');
    });
};

const othersFields = [
    ['diagnosis','diagnosisOther'],
    ['situsLoop','situsLoopOther'],
    ['systemicVeins','systemicVeinsOther'],
    ['pulmonaryVeins','pulmonaryVeinsOther'],
    ['atria','atriaOther'],
    ['atrialSeptum','atrialSeptumOther'],
    ['avValves','avValvesOther'],
    ['ventricles','ventriclesOther'],
    ['ventricularSeptum','ventricularSeptumOther'],
    ['outflowTracts','outflowTractsOther'],
    ['pulmonaryArteries','pulmonaryArteriesOther'],
    ['aorticArch','aorticArchOther'],
    ['othersField','othersFieldOther'],
    ['impression','impressionOther']
];
othersFields.forEach(f => toggleOthers(f[0], f[1]));

function getValue(selectId, otherId) {
    const sel = document.getElementById(selectId);
    return sel.value === 'Others' ? document.getElementById(otherId).value : sel.value;
}

// ------------------- FORM SUBMISSION -------------------
const form = document.getElementById('echoForm');
const params = new URLSearchParams(window.location.search);
const updateId = params.get("update");

form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!patientIdInput.value.trim()) { alert("Patient ID required"); return; }

    const data = {
        patient_id: patientIdInput.value.trim(),
        name: document.getElementById('name').value,
        dob: dobInput.value,
        age: ageInput.value,
        sex: document.getElementById('sex').value,
        weight: document.getElementById('weight').value,
        diagnosis: getValue('diagnosis','diagnosisOther'),
        situs_loop: getValue('situsLoop','situsLoopOther'),
        systemic_veins: getValue('systemicVeins','systemicVeinsOther'),
        pulmonary_veins: getValue('pulmonaryVeins','pulmonaryVeinsOther'),
        atria: getValue('atria','atriaOther'),
        atrial_septum: getValue('atrialSeptum','atrialSeptumOther'),
        av_valves: getValue('avValves','avValvesOther'),
        ventricles: getValue('ventricles','ventriclesOther'),
        ventricular_septum: getValue('ventricularSeptum','ventricularSeptumOther'),
        outflow_tracts: getValue('outflowTracts','outflowTractsOther'),
        pulmonary_arteries: getValue('pulmonaryArteries','pulmonaryArteriesOther'),
        aortic_arch: getValue('aorticArch','aorticArchOther'),
        others_field: getValue('othersField','othersFieldOther'),
        impression: getValue('impression','impressionOther')
    };

    const method = updateId ? 'PUT' : 'POST';
    const url = updateId ? `/patients/${updateId}` : '/patients';

    try {
        const res = await fetch(url, {
            method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if(result.status === 'success'){
            alert(updateId ? 'Patient updated!' : 'Patient saved!');
            if(!updateId) form.reset(); 
            ageInput.value='';
            if(updateId) window.location.href='records.html';
        } else alert('Error: '+result.message);
    } catch(err){ alert('Server error: '+err.message); }
});

// ------------------- DOWNLOAD PDF -------------------
async function downloadPDF(data) {
    try {
        const res = await fetch("/generate-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if(!res.ok) throw new Error("Server returned " + res.status);

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `TinyHeartsReport-${data.name}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);

    } catch(err) {
        alert('PDF generation failed: ' + err.message);
    }
}

// "Download Report" button click
document.getElementById("downloadReport").addEventListener("click", () => {
    const payload = {
        name: document.getElementById("name").value,
        age: document.getElementById("age").value,
        date: new Date().toLocaleDateString(),
        sex: document.getElementById("sex").value,
        weight: document.getElementById("weight").value,
        diagnosis: getValue('diagnosis','diagnosisOther'),
        situs_loop: getValue('situsLoop','situsLoopOther'),
        systemic_veins: getValue('systemicVeins','systemicVeinsOther'),
        pulmonary_veins: getValue('pulmonaryVeins','pulmonaryVeinsOther'),
        atria: getValue('atria','atriaOther'),
        atrial_septum: getValue('atrialSeptum','atrialSeptumOther'),
        av_valves: getValue('avValves','avValvesOther'),
        ventricles: getValue('ventricles','ventriclesOther'),
        ventricular_septum: getValue('ventricularSeptum','ventricularSeptumOther'),
        outflow_tracts: getValue('outflowTracts','outflowTractsOther'),
        pulmonary_arteries: getValue('pulmonaryArteries','pulmonaryArteriesOther'),
        aortic_arch: getValue('aorticArch','aorticArchOther'),
        others_field: getValue('othersField','othersFieldOther'),
        impression: getValue('impression','impressionOther')
    };

    if(!payload.name.trim()){ alert("Enter patient name before downloading PDF"); return; }

    downloadPDF(payload);
});

// ------------------- SEARCH PATIENT BY ID -------------------
document.getElementById("searchBtn").addEventListener("click", async () => {
    const searchId = document.getElementById("searchId").value.trim();
    if(!searchId){ alert("Enter Patient ID"); return; }
    try{
        const res = await fetch(`/patients/${searchId}`);
        if(res.status === 404){ alert("Patient not found"); return; }
        const data = await res.json();
        let output = "";
        for(const [key, val] of Object.entries(data)){
            output += `${key.replace(/_/g,' ').toUpperCase()}: ${val}\n`;
        }
        document.getElementById("searchResult").innerText = output;
    } catch(err){
        alert('Search failed: '+err.message);
    }
});
