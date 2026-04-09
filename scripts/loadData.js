import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medsentinel';

// Real Karnataka Hospital Data (PM-JAY + Aarogya Karnataka)
const hospitalsData = [
  // Bengaluru Government Hospitals
  { name: 'KC General Hospital', address: 'Malleshwaram, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', type: 'public', specialties: ['General Surgery', 'ENT', 'Orthopedics', 'General Medicine'], phone: '080-23346792', lat: 13.0067, lng: 77.5703, pmjay_empanelled: true },
  { name: 'Yelahanka General Hospital', address: 'Yelahanka, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', type: 'public', specialties: ['General Medicine', 'Pediatrics', 'Obstetrics'], phone: '080-28562301', lat: 13.1007, lng: 77.5963, pmjay_empanelled: true },
  { name: 'Victoria Hospital', address: 'Fort, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', type: 'public', specialties: ['Multispecialty', 'Trauma Care', 'Emergency Medicine', 'General Surgery'], phone: '080-26700301', lat: 12.9716, lng: 77.5946, pmjay_empanelled: true },
  { name: 'Bowring and Lady Curzon Hospital', address: 'Shivaji Nagar, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', type: 'public', specialties: ['Obstetrics', 'Gynecology', 'Pediatrics', 'Neonatology'], phone: '080-22268451', lat: 12.9897, lng: 77.6010, pmjay_empanelled: true },
  { name: 'Vani Vilas Hospital', address: 'KR Market, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', type: 'public', specialties: ['General Surgery', 'Orthopedics', 'General Medicine'], phone: '080-26708640', lat: 12.9591, lng: 77.5720, pmjay_empanelled: true },
  { name: 'Jayanagar General Hospital', address: 'Jayanagar 4th Block, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', type: 'public', specialties: ['General Medicine', 'Pediatrics', 'Dermatology'], phone: '080-26633862', lat: 12.9250, lng: 77.5937, pmjay_empanelled: true },
  { name: 'Rajiv Gandhi Institute of Chest Diseases', address: 'Rajajinagar, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', type: 'public', specialties: ['Pulmonology', 'Respiratory Medicine', 'TB Treatment'], phone: '080-23584351', lat: 12.9897, lng: 77.5560, pmjay_empanelled: true },
  
  // Bengaluru Private Empanelled Hospitals
  { name: 'Narayana Health City', address: 'Bommasandra, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', type: 'private', specialties: ['Cardiac Surgery', 'Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'Nephrology'], phone: '080-71222222', lat: 12.8050, lng: 77.6821, pmjay_empanelled: true },
  { name: 'Manipal Hospital', address: 'HAL Airport Road, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', type: 'private', specialties: ['Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'Gastroenterology'], phone: '080-25024444', lat: 12.9539, lng: 77.6677, pmjay_empanelled: true },
  { name: 'Apollo Hospital', address: 'Bannerghatta Road, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', type: 'private', specialties: ['Multispecialty', 'Oncology', 'Cardiology', 'Neurosurgery', 'Orthopedics'], phone: '1860-500-1066', lat: 12.8892, lng: 77.5989, pmjay_empanelled: true },
  { name: 'Fortis Hospital', address: 'Bannerghatta Road, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', type: 'private', specialties: ['Orthopedics', 'Neurosurgery', 'Cardiology', 'Oncology'], phone: '080-66214444', lat: 12.8976, lng: 77.6003, pmjay_empanelled: true },
  { name: 'Columbia Asia Hospital', address: 'Whitefield, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', type: 'private', specialties: ['General Surgery', 'Pediatrics', 'Orthopedics', 'Cardiology'], phone: '080-66214000', lat: 12.9698, lng: 77.7499, pmjay_empanelled: true },
  { name: 'Sakra World Hospital', address: 'Marathahalli, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', type: 'private', specialties: ['Multispecialty', 'Cardiology', 'Neurology', 'Orthopedics'], phone: '080-46444444', lat: 12.9539, lng: 77.6974, pmjay_empanelled: true },
  { name: 'BGS Gleneagles Global Hospital', address: 'Kengeri, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', type: 'private', specialties: ['Cardiology', 'Neurology', 'Oncology', 'Nephrology'], phone: '080-46801000', lat: 12.9141, lng: 77.4858, pmjay_empanelled: true },
  { name: 'Aster CMI Hospital', address: 'Hebbal, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', type: 'private', specialties: ['Multispecialty', 'Cardiology', 'Neurology', 'Gastroenterology'], phone: '080-43420100', lat: 13.0358, lng: 77.5970, pmjay_empanelled: true },
  
  // Mysuru District
  { name: 'JSS Hospital', address: 'MG Road, Mysuru', district: 'Mysuru', state: 'Karnataka', type: 'private', specialties: ['Multispecialty', 'Cardiology', 'Neurology', 'Orthopedics'], phone: '0821-2548000', lat: 12.3051, lng: 76.6553, pmjay_empanelled: true },
  { name: 'Apollo BGS Hospital', address: 'Adichunchanagiri Road, Mysuru', district: 'Mysuru', state: 'Karnataka', type: 'private', specialties: ['Oncology', 'Neurology', 'Cardiology', 'Orthopedics'], phone: '0821-2566666', lat: 12.2958, lng: 76.6394, pmjay_empanelled: true },
  { name: 'KR Hospital', address: 'Sayyaji Rao Road, Mysuru', district: 'Mysuru', state: 'Karnataka', type: 'public', specialties: ['General Surgery', 'General Medicine', 'Obstetrics', 'Pediatrics'], phone: '0821-2423912', lat: 12.3051, lng: 76.6553, pmjay_empanelled: true },
  
  // Mangaluru District
  { name: 'KMC Hospital', address: 'Ambedkar Circle, Mangaluru', district: 'Dakshina Kannada', state: 'Karnataka', type: 'private', specialties: ['Multispecialty', 'Nephrology', 'Cardiology', 'Neurology'], phone: '0824-2445000', lat: 12.8698, lng: 74.8430, pmjay_empanelled: true },
  { name: 'AJ Hospital', address: 'Kuntikana, Mangaluru', district: 'Dakshina Kannada', state: 'Karnataka', type: 'private', specialties: ['Orthopedics', 'General Surgery', 'Cardiology'], phone: '0824-2225533', lat: 12.9141, lng: 74.8560, pmjay_empanelled: true },
  { name: 'Wenlock District Hospital', address: 'Hampankatta, Mangaluru', district: 'Dakshina Kannada', state: 'Karnataka', type: 'public', specialties: ['General Surgery', 'General Medicine', 'Emergency Medicine'], phone: '0824-2428201', lat: 12.8698, lng: 74.8430, pmjay_empanelled: true },
  
  // Hubli-Dharwad
  { name: 'KIMS Hospital', address: 'Vidyanagar, Hubli', district: 'Dharwad', state: 'Karnataka', type: 'private', specialties: ['Cardiology', 'Neurosurgery', 'Orthopedics', 'Oncology'], phone: '0836-2377777', lat: 15.3647, lng: 75.1240, pmjay_empanelled: true },
  { name: 'SDM Hospital', address: 'Sattur, Dharwad', district: 'Dharwad', state: 'Karnataka', type: 'private', specialties: ['General Medicine', 'Pediatrics', 'Orthopedics'], phone: '0836-2447344', lat: 15.4589, lng: 75.0078, pmjay_empanelled: true },
  { name: 'KIMS Hubli Civil Hospital', address: 'Unkal, Hubli', district: 'Dharwad', state: 'Karnataka', type: 'public', specialties: ['General Surgery', 'General Medicine', 'Obstetrics'], phone: '0836-2214001', lat: 15.3647, lng: 75.1240, pmjay_empanelled: true },
  
  // Belgaum District
  { name: 'KLE Hospital', address: 'Nehru Nagar, Belgaum', district: 'Belgaum', state: 'Karnataka', type: 'private', specialties: ['Multispecialty', 'Oncology', 'Cardiology', 'Neurology'], phone: '0831-2473777', lat: 15.8497, lng: 74.4977, pmjay_empanelled: true },
  { name: 'District Hospital Belgaum', address: 'Tilakwadi, Belgaum', district: 'Belgaum', state: 'Karnataka', type: 'public', specialties: ['General Surgery', 'Obstetrics', 'General Medicine'], phone: '0831-2405001', lat: 15.8497, lng: 74.4977, pmjay_empanelled: true },
  
  // Uttara Kannada
  { name: '24X7 Hi-Tech Lifeline Hospital', address: 'Karwar', district: 'Uttara Kannada', state: 'Karnataka', type: 'private', specialties: ['Emergency Care', 'General Medicine', 'General Surgery'], phone: '08382-226688', lat: 14.8134, lng: 74.1296, pmjay_empanelled: true },
  { name: 'District Hospital Karwar', address: 'Karwar', district: 'Uttara Kannada', state: 'Karnataka', type: 'public', specialties: ['General Surgery', 'Obstetrics', 'General Medicine'], phone: '08382-226001', lat: 14.8134, lng: 74.1296, pmjay_empanelled: true }
];

// Treatment Costs Data (Based on NHSCD and Kaggle datasets)
const costsData = [
  // General Surgery
  { procedure: 'Appendectomy', category: 'General Surgery', public_low: 8000, public_high: 25000, private_low: 40000, private_high: 150000, avg_duration_days: 3 },
  { procedure: 'Hernia Repair', category: 'General Surgery', public_low: 10000, public_high: 30000, private_low: 50000, private_high: 180000, avg_duration_days: 2 },
  { procedure: 'Gallbladder Removal', category: 'General Surgery', public_low: 15000, public_high: 40000, private_low: 60000, private_high: 200000, avg_duration_days: 3 },
  { procedure: 'Thyroid Surgery', category: 'General Surgery', public_low: 20000, public_high: 50000, private_low: 80000, private_high: 250000, avg_duration_days: 4 },
  
  // Cardiology
  { procedure: 'Angioplasty', category: 'Cardiology', public_low: 80000, public_high: 150000, private_low: 200000, private_high: 500000, avg_duration_days: 5 },
  { procedure: 'Bypass Surgery', category: 'Cardiology', public_low: 150000, public_high: 300000, private_low: 400000, private_high: 1000000, avg_duration_days: 10 },
  { procedure: 'Pacemaker Implant', category: 'Cardiology', public_low: 100000, public_high: 200000, private_low: 250000, private_high: 600000, avg_duration_days: 3 },
  { procedure: 'Heart Valve Replacement', category: 'Cardiology', public_low: 200000, public_high: 400000, private_low: 500000, private_high: 1200000, avg_duration_days: 12 },
  
  // Orthopedics
  { procedure: 'Knee Replacement', category: 'Orthopedics', public_low: 80000, public_high: 150000, private_low: 200000, private_high: 500000, avg_duration_days: 7 },
  { procedure: 'Hip Replacement', category: 'Orthopedics', public_low: 100000, public_high: 180000, private_low: 250000, private_high: 600000, avg_duration_days: 8 },
  { procedure: 'Fracture Treatment', category: 'Orthopedics', public_low: 15000, public_high: 50000, private_low: 60000, private_high: 200000, avg_duration_days: 5 },
  { procedure: 'Spine Surgery', category: 'Orthopedics', public_low: 120000, public_high: 250000, private_low: 300000, private_high: 800000, avg_duration_days: 10 },
  
  // Neurology/Neurosurgery
  { procedure: 'Brain Tumor Surgery', category: 'Neurosurgery', public_low: 200000, public_high: 400000, private_low: 500000, private_high: 1500000, avg_duration_days: 15 },
  { procedure: 'Stroke Treatment', category: 'Neurology', public_low: 50000, public_high: 120000, private_low: 150000, private_high: 400000, avg_duration_days: 7 },
  
  // Oncology
  { procedure: 'Chemotherapy (per cycle)', category: 'Oncology', public_low: 15000, public_high: 40000, private_low: 50000, private_high: 150000, avg_duration_days: 1 },
  { procedure: 'Radiation Therapy', category: 'Oncology', public_low: 80000, public_high: 150000, private_low: 200000, private_high: 500000, avg_duration_days: 30 },
  { procedure: 'Cancer Surgery', category: 'Oncology', public_low: 100000, public_high: 250000, private_low: 300000, private_high: 1000000, avg_duration_days: 10 },
  
  // Obstetrics & Gynecology
  { procedure: 'Normal Delivery', category: 'Obstetrics', public_low: 5000, public_high: 15000, private_low: 30000, private_high: 100000, avg_duration_days: 2 },
  { procedure: 'C-Section', category: 'Obstetrics', public_low: 10000, public_high: 30000, private_low: 50000, private_high: 200000, avg_duration_days: 4 },
  { procedure: 'Hysterectomy', category: 'Gynecology', public_low: 25000, public_high: 60000, private_low: 80000, private_high: 250000, avg_duration_days: 5 },
  
  // Nephrology
  { procedure: 'Dialysis (per session)', category: 'Nephrology', public_low: 1000, public_high: 2000, private_low: 2500, private_high: 5000, avg_duration_days: 1 },
  { procedure: 'Kidney Transplant', category: 'Nephrology', public_low: 300000, public_high: 500000, private_low: 600000, private_high: 1500000, avg_duration_days: 20 },
  
  // General Medicine
  { procedure: 'Diabetes Management', category: 'General Medicine', public_low: 5000, public_high: 15000, private_low: 20000, private_high: 60000, avg_duration_days: 5 },
  { procedure: 'Pneumonia Treatment', category: 'General Medicine', public_low: 8000, public_high: 20000, private_low: 30000, private_high: 80000, avg_duration_days: 5 },
  { procedure: 'Dengue Treatment', category: 'General Medicine', public_low: 10000, public_high: 25000, private_low: 35000, private_high: 100000, avg_duration_days: 5 }
];

// Government Schemes Data
const schemesData = [
  {
    name: 'Ayushman Bharat PM-JAY',
    description: 'Pradhan Mantri Jan Arogya Yojana - National health protection scheme providing health cover of Rs. 5 lakhs per family per year',
    coverage_amount: 500000,
    eligibility_criteria: {
      income_max: 200000,
      secc_eligible: true,
      age_70_plus: true,
      states: ['All India']
    },
    covered_procedures: 1949,
    type: 'National',
    application_url: 'https://pmjay.gov.in/',
    helpline: '14555'
  },
  {
    name: 'Aarogya Karnataka',
    description: 'Karnataka state health insurance scheme providing coverage up to Rs. 5 lakhs for BPL and APL families',
    coverage_amount: 500000,
    eligibility_criteria: {
      income_max: 300000,
      bpl_card: true,
      apl_card: true,
      states: ['Karnataka']
    },
    covered_procedures: 1500,
    type: 'State',
    application_url: 'https://www.karnataka.gov.in/aarogyakarnatakascheme',
    helpline: '104'
  },
  {
    name: 'ESIC (Employee State Insurance)',
    description: 'Health insurance for employees earning up to Rs. 21,000 per month',
    coverage_amount: 'Comprehensive',
    eligibility_criteria: {
      income_max: 252000,
      salaried: true,
      states: ['All India']
    },
    covered_procedures: 'All',
    type: 'National',
    application_url: 'https://www.esic.nic.in/',
    helpline: '1800-11-2526'
  },
  {
    name: 'CGHS (Central Government Health Scheme)',
    description: 'Comprehensive health coverage for central government employees and pensioners',
    coverage_amount: 'Comprehensive',
    eligibility_criteria: {
      central_govt_employee: true,
      pensioner: true,
      states: ['All India']
    },
    covered_procedures: 'All',
    type: 'National',
    application_url: 'https://cghs.gov.in/',
    helpline: '1800-11-8900'
  },
  {
    name: 'Vajpayee Arogyashree',
    description: 'Karnataka government scheme for BPL families covering critical illnesses',
    coverage_amount: 200000,
    eligibility_criteria: {
      bpl_card: true,
      states: ['Karnataka']
    },
    covered_procedures: 400,
    type: 'State',
    application_url: 'https://www.karnataka.gov.in/vajpayeearogyashree',
    helpline: '104'
  }
];

async function loadData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('medsentinel');
    
    // Clear existing collections
    await db.collection('hospitals').deleteMany({});
    await db.collection('costs').deleteMany({});
    await db.collection('schemes').deleteMany({});
    
    // Insert hospitals
    const hospitalsResult = await db.collection('hospitals').insertMany(hospitalsData);
    console.log(`✅ Inserted ${hospitalsResult.insertedCount} hospitals`);
    
    // Insert costs
    const costsResult = await db.collection('costs').insertMany(costsData);
    console.log(`✅ Inserted ${costsResult.insertedCount} treatment costs`);
    
    // Insert schemes
    const schemesResult = await db.collection('schemes').insertMany(schemesData);
    console.log(`✅ Inserted ${schemesResult.insertedCount} government schemes`);
    
    // Create indexes
    await db.collection('hospitals').createIndex({ district: 1, type: 1 });
    await db.collection('hospitals').createIndex({ specialties: 1 });
    await db.collection('costs').createIndex({ procedure: 1, category: 1 });
    await db.collection('schemes').createIndex({ type: 1 });
    
    console.log('✅ Created indexes');
    console.log('\n🎉 Data loading complete!');
    
  } catch (error) {
    console.error('❌ Error loading data:', error);
  } finally {
    await client.close();
  }
}

loadData();
