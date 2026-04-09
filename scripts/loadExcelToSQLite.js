import XLSX from 'xlsx';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const excelFile = join(__dirname, '..', 'medsentinel_25_hospitals_dataset.xlsx');
const dbFile = join(__dirname, '..', 'medsentinel.db');

const db = new sqlite3.Database(dbFile);

async function loadExcelToSQLite() {
  try {
    // Read Excel
    const workbook = XLSX.readFile(excelFile);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // Filter valid rows
    const validData = data.filter(row => 
      row['Hospital ID'] && 
      row['Hospital Name'] && 
      !row['Hospital Name'].includes('Hospital Name')
    );
    
    console.log(`📊 Processing ${validData.length} hospitals from Excel`);
    
    // Clear existing data
    db.run('DELETE FROM hospitals');
    db.run('DELETE FROM schemes');
    
    let hospitalCount = 0;
    let schemeCount = 0;
    const schemeSet = new Set();
    
    // Insert hospitals
    const insertHospital = db.prepare(`
      INSERT INTO hospitals (name, location, specialization, rating, distance, cost_range, schemes, image_url, facilities)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const row of validData) {
      const specialty = row['Primary Specialty'] || 'General Medicine';
      const district = row['District/City'] || 'Bengaluru';
      const state = row['State'] || 'Karnataka';
      const location = `${district}, ${state}`;
      const costRange = row['Estimated Cost Range (INR)'] || '₹10,000 - ₹50,000';
      const schemes = row['Applicable Scheme'] || 'Ayushman Bharat';
      const facilities = '24/7 ER,ICU,OPD,Pharmacy';
      
      insertHospital.run(
        row['Hospital Name'],
        location,
        specialty,
        (4.0 + Math.random()).toFixed(1),
        (Math.random() * 20).toFixed(1),
        costRange,
        schemes,
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800',
        facilities
      );
      hospitalCount++;
      
      // Collect schemes
      const schemeStr = row['Applicable Scheme'] || '';
      const schemeNames = schemeStr.split(/[,/]/).map(s => s.trim()).filter(s => s);
      schemeNames.forEach(schemeName => {
        if (schemeName && !schemeSet.has(schemeName)) {
          schemeSet.add(schemeName);
        }
      });
    }
    
    insertHospital.finalize();
    
    // Insert schemes
    const insertScheme = db.prepare(`
      INSERT INTO schemes (name, description, coverage, eligibility, type)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    schemeSet.forEach(schemeName => {
      const type = schemeName.includes('State') ? 'State' : 'Central';
      
      insertScheme.run(
        schemeName,
        `${schemeName} provides cashless treatment for eligible beneficiaries.`,
        '₹5,00,000 per family per year',
        'Income below ₹3 lakhs per annum or BPL/APL card holders',
        type
      );
      schemeCount++;
    });
    
    insertScheme.finalize();
    
    console.log(`✅ Inserted ${hospitalCount} hospitals`);
    console.log(`✅ Inserted ${schemeCount} schemes`);
    console.log('\\n🎉 Excel data loaded to SQLite successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.close();
  }
}

loadExcelToSQLite();
