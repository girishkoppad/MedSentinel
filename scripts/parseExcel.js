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

async function loadExcelData() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const hospitalsCol = db.collection('hospitals');
    const costsCol = db.collection('costs');
    const schemesCol = db.collection('schemes');
    
    // Read Excel file
    const workbook = XLSX.readFile(excelFile);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Total rows found: ${data.length}`);
    
    // Filter out header/empty rows
    const validData = data.filter(row => 
      row['Hospital ID'] && 
      row['Hospital Name'] && 
      !row['Hospital Name'].includes('Hospital Name')
    );
    
    console.log(`✅ Valid hospital records: ${validData.length}`);
    
    // Transform and load hospitals
    const hospitals = [];
    const costs = [];
    const schemes = new Map();
    
    for (const row of validData) {
      const hospitalId = row['Hospital ID'];
      const hospitalName = row['Hospital Name'];
      const hospitalType = row['Hospital Type'] || 'Government';
      const state = row['State'] || 'Karnataka';
      const district = row['District/City'] || 'Bengaluru';
      const address = row['Address/Location'] || '';
      const specialty = row['Primary Specialty'] || 'General Medicine';
      const treatmentCategory = row['Treatment Category'] || '';
      const costRange = row['Estimated Cost Range (INR)'] || '';
      const scheme = row['Applicable Scheme'] || '';
      const schemeEligibility = row['Scheme Eligibility'] || '';
      const schemeCoverage = row['Scheme Coverage'] || '';
      
      // Parse cost range
      let publicLow = 0, publicHigh = 0, privateLow = 0, privateHigh = 0;
      if (costRange) {
        const match = costRange.match(/₹?([\d,]+)[-–]₹?([\d,]+)/);
        if (match) {
          const low = parseInt(match[1].replace(/,/g, ''));
          const high = parseInt(match[2].replace(/,/g, ''));
          if (hospitalType.toLowerCase().includes('government') || hospitalType.toLowerCase().includes('public')) {
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
      }
      
      // Add hospital
      const hospital = {
        hospital_id: hospitalId,
        name: hospitalName,
        type: hospitalType,
        state: state,
        district: district,
        address: address,
        specialties: [specialty],
        phone: '+91-80-XXXXXXXX',
        pmjay_empanelled: scheme.includes('PM-JAY') || scheme.includes('Ayushman'),
        rating: 4.0 + Math.random(),
        image: `https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800`,
        lat: 12.9716 + (Math.random() - 0.5) * 0.5,
        lng: 77.5946 + (Math.random() - 0.5) * 0.5
      };
      hospitals.push(hospital);
      
      // Add cost if available
      if (treatmentCategory && publicLow > 0) {
        costs.push({
          procedure: treatmentCategory,
          category: specialty,
          public_low: publicLow,
          public_high: publicHigh,
          private_low: privateLow,
          private_high: privateHigh,
          average_duration: '1-3 days'
        });
      }
      
      // Collect schemes
      if (scheme && schemeEligibility) {
        const schemeNames = scheme.split(/[,/]/).map(s => s.trim()).filter(s => s);
        schemeNames.forEach(schemeName => {
          if (!schemes.has(schemeName)) {
            schemes.set(schemeName, {
              name: schemeName,
              type: schemeName.includes('State') ? 'State' : 'Central',
              state: schemeName.includes('State') ? state : 'All India',
              eligibility: schemeEligibility,
              coverage: schemeCoverage || 'Up to ₹5,00,000 per family per year',
              description: `${schemeName} provides cashless treatment for eligible beneficiaries.`,
              application_url: 'https://pmjay.gov.in',
              helpline: '14555'
            });
          }
        });
      }
    }
    
    // Clear existing data
    await hospitalsCol.deleteMany({});
    await costsCol.deleteMany({});
    await schemesCol.deleteMany({});
    
    // Insert hospitals
    if (hospitals.length > 0) {
      await hospitalsCol.insertMany(hospitals);
      console.log(`✅ Inserted ${hospitals.length} hospitals`);
    }
    
    // Insert costs
    if (costs.length > 0) {
      await costsCol.insertMany(costs);
      console.log(`✅ Inserted ${costs.length} cost records`);
    }
    
    // Insert schemes
    const schemeArray = Array.from(schemes.values());
    if (schemeArray.length > 0) {
      await schemesCol.insertMany(schemeArray);
      console.log(`✅ Inserted ${schemeArray.length} schemes`);
    }
    
    console.log('\n🎉 Data loading completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

loadExcelData();
