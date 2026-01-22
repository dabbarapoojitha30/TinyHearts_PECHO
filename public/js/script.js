// ------------------- LIVE DATE -------------------
document.getElementById('currentDate').innerText =
    new Date().toLocaleDateString();

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

function setSelectOrOther(selectId, otherId, value){
    const sel = document.getElementById(selectId);
    const ta = document.getElementById(otherId);

    if ([...sel.options].some(o => o.value === value)) {
        sel.value = value;
        ta.classList.add('d-none');
    } else {
        sel.value = 'Others';
        ta.classList.remove('d-none');
        ta.value = value;
    }
}

function getValue(selectId, otherId) {
    const sel = document.getElementById(selectId);
    return sel.value === 'Others'
        ? document.getElementById(otherId).value
        : sel.value;
}

// ------------------- LOAD PATIENT FOR EDIT -------------------
const params = new URLSearchParams(window.location.search);
const updateId = params.get("update");

if (updateId) {
    fetch(`/patients/${updateId}`)
        .then(res => res.json())
        .then(data => {
            patientIdInput.value = data.patient_id;
            patientIdInput.readOnly = true;

            document.getElementById('name').value = data.name;
            dobInput.value = data.dob;
            ageInput.value = data.age;
            document.getElementById('sex').value = data.sex;
            document.getElementById('weight').value = data.weight;

            setSelectOrOther('diagnosis','diagnosisOther',data.diagnosis);
            setSelectOrOther('situsLoop','situsLoopOther',data.situs_loop);
            setSelectOrOther('systemicVeins','systemicVeinsOther',data.systemic_veins);
            setSelectOrOther('pulmonaryVeins','pulmonaryVeinsOther',data.pulmonary_veins);
            setSelectOrOther('atria','atriaOther',data.atria);
            setSelectOrOther('atrialSeptum','atrialSeptumOther',data.atrial_septum);
            setSelectOrOther('avValves','avValvesOther',data.av_valves);
            setSelectOrOther('ventricles','ventriclesOther',data.ventricles);
            setSelectOrOther('ventricularSeptum','ventricularSeptumOther',data.ventricular_septum);
            setSelectOrOther('outflowTracts','outflowTractsOther',data.outflow_tracts);
            setSelectOrOther('pulmonaryArteries','pulmonaryArteriesOther',data.pulmonary_arteries);
            setSelectOrOther('aorticArch','aorticArchOther',data.aortic_arch);
            setSelectOrOther('othersField','othersFieldOther',data.others_field);
            setSelectOrOther('impression','impressionOther',data.impression);
        })
        .catch(err => alert("Failed to load patient"));
}

// ------------------- FORM SUBMIT -------------------
const form = document.getElementById('echoForm');

form.addEventListener('submit', async e => {
    e.preventDefault();

    const payload = {
        patient_id: patientIdInput.value,
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

    const res = await fetch(url, {
        method,
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.status === 'success') {
        alert(updateId ? "Patient updated" : "Patient saved");
        window.location.href = 'records.html';
    } else {
        alert(result.message);
    }
});
// ------------------- DOWNLOAD PDF -------------------
document.addEventListener("DOMContentLoaded", () => {
    const downloadBtn = document.getElementById("downloadReport");
    if(!downloadBtn) return;

    downloadBtn.addEventListener("click", async () => {
        const payload = {
            patient_id: patientIdInput.value,
            name: document.getElementById("name").value,
            age: ageInput.value,
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

        if(!payload.name.trim()){
            alert("Enter patient name before downloading PDF");
            return;
        }

        try {
            const res = await fetch("/generate-pdf", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify(payload)
            });

            if(!res.ok) throw new Error("Server returned " + res.status);

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `TinyHeartsReport-${payload.name}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch(err){
            alert("PDF generation failed: " + err.message);
        }
    });
});
