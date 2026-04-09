import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const db = new sqlite3.Database(join(__dirname, '..', 'medsentinel.db'));

const hospitals = [
  ['KC General Hospital', 'Malleshwaram, Bengaluru', 'General Surgery, ENT, Orthopedics', 4.2, 3.5, '₹15,000 - ₹45,000', 'Ayushman Bharat PM-JAY,Aarogya Karnataka', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800', '24/7 ER,ICU,General Ward,OPD'],
  ['Yelahanka General Hospital', 'Yelahanka, Bengaluru', 'General Medicine, Pediatrics, Obstetrics', 4.0, 8.2, '₹10,000 - ₹35,000', 'Ayushman Bharat PM-JAY,Aarogya Karnataka', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800', '24/7 ER,Pharmacy,Lab,Maternity'],
  ['Victoria Hospital', 'Fort, Bengaluru', 'Multispecialty, Trauma Care, Emergency Medicine', 4.3, 2.1, '₹12,000 - ₹50,000', 'Ayushman Bharat PM-JAY,ESIC,CGHS', 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800', '24/7 ER,ICU,Trauma Center,Blood Bank'],
  ['Bowring and Lady Curzon Hospital', 'Shivaji Nagar, Bengaluru', 'Obstetrics, Gynecology, Pediatrics, Neonatology', 4.1, 3.8, '₹8,000 - ₹30,000', 'Ayushman Bharat PM-JAY,Aarogya Karnataka', 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800', 'Maternity Ward,NICU,OPD,Lab'],
  ['Vani Vilas Hospital', 'KR Market, Bengaluru', 'General Surgery, Orthopedics, General Medicine', 3.9, 4.2, '₹10,000 - ₹40,000', 'Ayushman Bharat PM-JAY', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800', '24/7 ER,General Ward,OT,Pharmacy'],
  ['Jayanagar General Hospital', 'Jayanagar 4th Block, Bengaluru', 'General Medicine, Pediatrics, Dermatology', 4.0, 5.6, '₹8,000 - ₹28,000', 'Ayushman Bharat PM-JAY,Aarogya Karnataka', 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800', 'OPD,Lab,Pharmacy,General Ward'],
  ['Rajiv Gandhi Institute of Chest Diseases', 'Rajajinagar, Bengaluru', 'Pulmonology, Respiratory Medicine, TB Treatment', 4.2, 6.1, '₹10,000 - ₹35,000', 'Ayushman Bharat PM-JAY,CGHS', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800', 'ICU,Pulmonology Ward,Diagnostics,OPD'],
  ['Narayana Health City', 'Bommasandra, Bengaluru', 'Cardiac Surgery, Cardiology, Neurology, Oncology, Nephrology', 4.7, 15.3, '₹40,000 - ₹2,00,000', 'Ayushman Bharat PM-JAY,Aarogya Karnataka,CGHS', 'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=800', 'Cardiac Care,ICU,Dialysis,Transplant,Cath Lab'],
  ['Manipal Hospital', 'HAL Airport Road, Bengaluru', 'Cardiology, Neurology, Oncology, Orthopedics, Gastroenterology', 4.8, 6.5, '₹50,000 - ₹2,50,000', 'Ayushman Bharat PM-JAY,CGHS,ESIC', 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800', '24/7 ER,ICU,Cath Lab,Advanced Diagnostics,Robotic Surgery'],
  ['Apollo Hospital', 'Bannerghatta Road, Bengaluru', 'Multispecialty, Oncology, Cardiology, Neurosurgery', 4.9, 9.8, '₹60,000 - ₹3,00,000', 'Ayushman Bharat PM-JAY,CGHS,ESIC', 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800', '24/7 ER,ICU,Cancer Center,Robotic Surgery,Transplant'],
  ['Fortis Hospital', 'Bannerghatta Road, Bengaluru', 'Orthopedics, Neurosurgery, Cardiology, Oncology', 4.6, 10.2, '₹55,000 - ₹2,80,000', 'Ayushman Bharat PM-JAY,CGHS', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800', '24/7 ER,Neuro ICU,Joint Replacement,Cath Lab'],
  ['Columbia Asia Hospital', 'Whitefield, Bengaluru', 'General Surgery, Pediatrics, Orthopedics, Cardiology', 4.5, 12.7, '₹35,000 - ₹1,50,000', 'Ayushman Bharat PM-JAY,ESIC', 'https://images.unsplash.com/photo-1519494080410-f9aa76cb4283?w=800', '24/7 ER,ICU,Pediatric Ward,OT'],
  ['Sakra World Hospital', 'Marathahalli, Bengaluru', 'Multispecialty, Cardiology, Neurology, Orthopedics', 4.5, 11.3, '₹45,000 - ₹2,00,000', 'Ayushman Bharat PM-JAY,CGHS', 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800', '24/7 ER,ICU,Cardiac Care,Neuro ICU'],
  ['Aster CMI Hospital', 'Hebbal, Bengaluru', 'Multispecialty, Cardiology, Neurology, Gastroenterology', 4.6, 7.4, '₹50,000 - ₹2,20,000', 'Ayushman Bharat PM-JAY,CGHS,ESIC', 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800', '24/7 ER,ICU,Cath Lab,Endoscopy,Transplant'],
  ['JSS Hospital', 'MG Road, Mysuru', 'Multispecialty, Cardiology, Neurology, Orthopedics', 4.6, 145.0, '₹30,000 - ₹1,20,000', 'Ayushman Bharat PM-JAY,ESIC', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800', '24/7 ER,ICU,Cardiac Care,OT'],
  ['Apollo BGS Hospital', 'Adichunchanagiri Road, Mysuru', 'Oncology, Neurology, Cardiology, Orthopedics', 4.7, 147.0, '₹45,000 - ₹2,00,000', 'Ayushman Bharat PM-JAY,CGHS', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800', 'Cancer Center,Neuro ICU,Diagnostics,Cath Lab'],
  ['KMC Hospital', 'Ambedkar Circle, Mangaluru', 'Multispecialty, Nephrology, Cardiology, Neurology', 4.5, 352.0, '₹35,000 - ₹1,80,000', 'Ayushman Bharat PM-JAY,ESIC', 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800', '24/7 ER,Dialysis,ICU,Transplant'],
  ['KIMS Hospital', 'Vidyanagar, Hubli', 'Cardiology, Neurosurgery, Orthopedics, Oncology', 4.6, 410.0, '₹40,000 - ₹1,90,000', 'Ayushman Bharat PM-JAY,CGHS', 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800', 'Cardiac Cath Lab,Neuro ICU,24/7 ER,OT'],
  ['KLE Hospital', 'Nehru Nagar, Belgaum', 'Multispecialty, Oncology, Cardiology, Neurology', 4.5, 502.0, '₹35,000 - ₹1,60,000', 'Ayushman Bharat PM-JAY', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800', 'Cancer Center,ICU,24/7 ER,OT'],
  ['Indira Gandhi Institute of Child Health', 'Bangalore-560029, Bengaluru', 'Pediatrics, Pediatric Surgery, Neonatology', 4.4, 4.8, '₹12,000 - ₹60,000', 'Ayushman Bharat PM-JAY,Aarogya Karnataka,CGHS', 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800', 'Pediatric ICU,NICU,OT,Diagnostics,OPD']
];

const schemes = [
  ['Ayushman Bharat PM-JAY', 'Pradhan Mantri Jan Arogya Yojana provides health cover of ₹5 lakhs per family per year for secondary and tertiary care hospitalization. Covers 1,949+ medical procedures across 27 specialties including cancer, cardiac, neurology, and orthopedics.', '₹5,00,000 per family/year', 'SECC 2011 listed families, rural/urban poor, age 70+ (all categories), no adult male earner households. Annual income below ₹2 lakhs.', 'National'],
  ['Aarogya Karnataka', 'Karnataka state health insurance scheme providing comprehensive coverage for BPL and APL families. Covers hospitalization, surgeries, and critical illness treatments at empanelled hospitals across Karnataka.', '₹5,00,000 per family/year', 'Karnataka residents with BPL/APL ration card, annual income below ₹3 lakhs. Covers family of 5 members.', 'State'],
  ['ESIC (Employee State Insurance)', 'Comprehensive medical care for insured employees and their dependents. Covers all medical expenses including hospitalization, medicines, specialist consultations, maternity benefits, and disability benefits.', 'Comprehensive (no monetary cap)', 'Employees earning up to ₹21,000/month (₹25,000 for persons with disability) in registered establishments with 10+ employees.', 'National'],
  ['CGHS (Central Govt Health Scheme)', 'Health coverage for central government employees, pensioners, and their dependents. Provides cashless treatment at empanelled hospitals and reimbursement for non-empanelled hospitals across India.', 'Comprehensive (no monetary cap)', 'Central government employees, pensioners, and their dependents. Includes retired employees and family pensioners.', 'National'],
  ['Vajpayee Arogyashree', 'Karnataka government scheme for BPL families covering critical illnesses and major surgeries. Provides cashless treatment at government and empanelled private hospitals for 403 procedures.', '₹2,00,000 per family/year', 'Karnataka BPL card holders, annual income below ₹75,000. Covers family of 5 members for critical illnesses.', 'State']
];

db.serialize(() => {
  db.run('DELETE FROM hospitals');
  db.run('DELETE FROM schemes');

  const hStmt = db.prepare('INSERT INTO hospitals (name, location, specialization, rating, distance, cost_range, schemes, image_url, facilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  hospitals.forEach(h => hStmt.run(h));
  hStmt.finalize();

  const sStmt = db.prepare('INSERT INTO schemes (name, description, coverage, eligibility, type) VALUES (?, ?, ?, ?, ?)');
  schemes.forEach(s => sStmt.run(s));
  sStmt.finalize();

  setTimeout(() => {
    db.all('SELECT COUNT(*) as c FROM hospitals', (e, r) => console.log('✅ Hospitals:', r[0].c));
    db.all('SELECT COUNT(*) as c FROM schemes', (e, r) => { console.log('✅ Schemes:', r[0].c); db.close(); });
  }, 300);
});
