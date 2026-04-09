import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const excelFile = join(__dirname, '..', 'medsentinel_25_hospitals_dataset.xlsx');
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medsentinel';

async function loadExcelToMongo() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const hospitalsCol = db.collection('hospitals');
    const costsCol = db.collection('costs');
    const schemesCol = db.collection('schemes');
    
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
    
    const hospitals = [];
    const costs = [];
    const schemeMap = new Map();
    
    for (const row of validData) {
      const hospitalType = (row['Hospital Type'] || 'Government').toLowerCase().includes('government') ? 'public' : 'private';
      const specialty = row['Primary Specialty'] || 'General Medicine';
      const costRange = row['Estimated Cost Range (INR)'] || '';
      
      // Parse costs
      let publicLow = 0, publicHigh = 0, privateLow = 0, privateHigh = 0;
      const match = costRange.match(/₹?([\\d,]+)[-–]₹?([\\d,]+)/);
      if (match) {
        const low = parseInt(match[1].replace(/,/g, ''));
        const high = parseInt(match[2].replace(/,/g, ''));
        if (hospitalType === 'public') {
          publicLow = low;
          publicHigh = high;
          privateLow = low * 2;
          privateHigh = high * 2;
        } else {
          privateLow = low;
          privateHigh = high;
          publicLow = Math.floor(low * 0.5);
          publicHigh = Math.floor(high * 0.5);
        }
      }
      
      hospitals.push({
        hospital_id: row['Hospital ID'],
        name: row['Hospital Name'],
        type: hospitalType,
        state: row['State'] || 'Karnataka',
        district: row['District/City'] || 'Bengaluru',
        address: row['Address/Location'] || '',
        specialties: [specialty],
        phone: '+91-80-XXXXXXXX',
        pmjay_empanelled: (row['Applicable Scheme'] || '').includes('PM-JAY') || (row['Applicable Scheme'] || '').includes('Ayushman'),
        rating: 4.0 + Math.random(),
        image: `https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800`,
        lat: 12.9716 + (Math.random() - 0.5) * 0.5,
        lng: 77.5946 + (Math.random() - 0.5) * 0.5
      });
      
      if (row['Treatment Category'] && publicLow > 0) {
        costs.push({
          procedure: row['Treatment Category'],
          category: specialty,
          public_low: publicLow,
          public_high: publicHigh,
          private_low: privateLow,
          private_high: privateHigh,
          avg_duration_days: 3
        });
      }
      
      // Collect schemes
      const schemeStr = row['Applicable Scheme'] || '';
      const schemeNames = schemeStr.split(/[,/]/).map(s => s.trim()).filter(s => s);
      schemeNames.forEach(schemeName => {
        if (!schemeMap.has(schemeName)) {
          schemeMap.set(schemeName, {
            name: schemeName,
            type: schemeName.includes('State') ? 'State' : 'Central',
            state: schemeName.includes('State') ? (row['State'] || 'Karnataka') : 'All India',
            eligibility_criteria: { income_max: 300000 },
            coverage_amount: 500000,
            description: `${schemeName} provides cashless treatment for eligible beneficiaries.`,
            application_url: 'https://pmjay.gov.in',
            helpline: '14555'
          });
        }
      });
    }
    
    // Clear and insert
    await hospitalsCol.deleteMany({});
    await costsCol.deleteMany({});
    await schemesCol.deleteMany({});
    
    if (hospitals.length > 0) {
      await hospitalsCol.insertMany(hospitals);
      console.log(`✅ Inserted ${hospitals.length} hospitals`);
    }
    
    if (costs.length > 0) {
      await costsCol.insertMany(costs);
      console.log(`✅ Inserted ${costs.length} cost records`);
    }
    
    const schemes = Array.from(schemeMap.values());
    if (schemes.length > 0) {
      await schemesCol.insertMany(schemes);
      console.log(`✅ Inserted ${schemes.length} schemes`);
    }
    
    console.log('\\n🎉 Excel data loaded successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

loadExcelToMongo();
