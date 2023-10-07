const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Create or connect to the database
const db = new sqlite3.Database('prescription_hashes.db');

app.post('/generate-hash', (req, res) => {
    const { patientName, age, prescriptionDate, medicines, quantities, doctorName } = req.body;
    const prescriptionData = {
        patient_name: patientName,
        age: age,
        date: prescriptionDate,
        medicines: medicines.split(","),
        quantity: quantities.split(","),
        doctor_name: doctorName
    };

    const prescriptionJson = JSON.stringify(prescriptionData, Object.keys(prescriptionData).sort());
    const prescriptionHash = require('crypto').createHash('sha256').update(prescriptionJson).digest('hex');

    db.get('SELECT * FROM prescription_hashes WHERE hash = ?', [prescriptionHash], (err, row) => {
        if (row) {
            res.send('Invalid Prescription: Already Used');
        } else {
            db.run('INSERT INTO prescription_hashes (hash) VALUES (?)', [prescriptionHash], (err) => {
                if (err) {
                    console.error(err.message);
                    res.send('Error: Could not store prescription hash');
                } else {
                    res.send('Prescription Hash stored successfully');
                }
            });
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
