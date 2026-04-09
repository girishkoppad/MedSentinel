import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medsentinel';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

let db;
let openai;

// Initialize OpenAI (optional - works without API key with fallback logic)
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Connect to MongoDB
MongoClient.connect(MONGODB_URI)
  .then(client => {
    db = client.db('medsentinel');
    console.log('✅ Connected to MongoDB');
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Helper: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper: Map condition to specialties
function mapConditionToSpecialties(condition) {
  const mapping = {
    'appendectomy': ['General Surgery'],
    'appendicitis': ['General Surgery'],
    'hernia': ['General Surgery'],
    'gallbladder': ['General Surgery'],
    'thyroid': ['General Surgery', 'Endocrinology'],
    'heart': ['Cardiology', 'Cardiac Surgery'],
    'cardiac': ['Cardiology', 'Cardiac Surgery'],
    'angioplasty': ['Cardiology'],
    'bypass': ['Cardiology', 'Cardiac Surgery'],
    'knee': ['Orthopedics'],
    'hip': ['Orthopedics'],
    'fracture': ['Orthopedics'],
    'bone': ['Orthopedics'],
    'spine': ['Orthopedics', 'Neurosurgery'],
    'brain': ['Neurology', 'Neurosurgery'],
    'stroke': ['Neurology'],
    'cancer': ['Oncology'],
    'tumor': ['Oncology', 'Neurosurgery'],
    'chemotherapy': ['Oncology'],
    'pregnancy': ['Obstetrics'],
    'delivery': ['Obstetrics'],
    'cesarean': ['Obstetrics'],
    'kidney': ['Nephrology'],
    'dialysis': ['Nephrology'],
    'diabetes': ['General Medicine', 'Endocrinology'],
    'pneumonia': ['General Medicine', 'Pulmonology'],
    'dengue': ['General Medicine']
  };
  
  const lowerCondition = condition.toLowerCase();
  for (const [key, specialties] of Object.entries(mapping)) {
    if (lowerCondition.includes(key)) {
      return specialties;
    }
  }
  return ['General Medicine'];
}

// Helper: Check scheme eligibility
function checkSchemeEligibility(userProfile, schemes) {
  const eligible = [];
  
  for (const scheme of schemes) {
    let isEligible = false;
    const criteria = scheme.eligibility_criteria;
    
    // PM-JAY eligibility
    if (scheme.name.includes('PM-JAY')) {
      if (userProfile.income <= criteria.income_max || 
          userProfile.age >= 70 ||
          userProfile.secc_eligible) {
        isEligible = true;
      }
    }
    
    // Aarogya Karnataka eligibility
    if (scheme.name.includes('Aarogya Karnataka')) {
      if (userProfile.state === 'Karnataka' && 
          (userProfile.income <= criteria.income_max || 
           userProfile.bpl_card || 
           userProfile.apl_card)) {
        isEligible = true;
      }
    }
    
    // ESIC eligibility
    if (scheme.name.includes('ESIC')) {
      if (userProfile.salaried && userProfile.income <= criteria.income_max) {
        isEligible = true;
      }
    }
    
    // CGHS eligibility
    if (scheme.name.includes('CGHS')) {
      if (userProfile.central_govt_employee || userProfile.pensioner) {
        isEligible = true;
      }
    }
    
    // Vajpayee Arogyashree
    if (scheme.name.includes('Vajpayee')) {
      if (userProfile.state === 'Karnataka' && userProfile.bpl_card) {
        isEligible = true;
      }
    }
    
    if (isEligible) {
      eligible.push({
        name: scheme.name,
        coverage: scheme.coverage_amount,
        application_url: scheme.application_url,
        helpline: scheme.helpline
      });
    }
  }
  
  return eligible;
}

// API: Main Recommendation Endpoint
app.post('/api/recommend', async (req, res) => {
  try {
    const { condition, location, income, family_size, age, state, bpl_card, salaried, lat, lng } = req.body;
    
    if (!condition || !location) {
      return res.status(400).json({ error: 'Condition and location are required' });
    }
    
    // Map condition to specialties
    const specialties = mapConditionToSpecialties(condition);
    
    // Find matching hospitals
    const hospitals = await db.collection('hospitals').find({
      $or: [
        { district: new RegExp(location, 'i') },
        { address: new RegExp(location, 'i') }
      ],
      specialties: { $in: specialties }
    }).toArray();
    
    // Get treatment costs
    const costs = await db.collection('costs').find({
      $or: [
        { procedure: new RegExp(condition, 'i') },
        { category: { $in: specialties } }
      ]
    }).toArray();
    
    // Get schemes
    const schemes = await db.collection('schemes').find({}).toArray();
    
    // Check eligibility
    const userProfile = {
      income: income || 0,
      family_size: family_size || 1,
      age: age || 0,
      state: state || 'Karnataka',
      bpl_card: bpl_card || false,
      apl_card: income <= 300000,
      salaried: salaried || false,
      secc_eligible: income <= 200000
    };
    
    const eligibleSchemes = checkSchemeEligibility(userProfile, schemes);
    
    // Calculate costs and distances for each hospital
    const recommendations = hospitals.map(hospital => {
      const costData = costs.find(c => 
        hospital.type === 'public' ? true : c.procedure.toLowerCase().includes(condition.toLowerCase())
      ) || costs[0];
      
      const estimatedCost = hospital.type === 'public' 
        ? { low: costData.public_low, high: costData.public_high }
        : { low: costData.private_low, high: costData.private_high };
      
      // Calculate distance if user coordinates provided
      let distance = null;
      if (lat && lng && hospital.lat && hospital.lng) {
        distance = calculateDistance(lat, lng, hospital.lat, hospital.lng).toFixed(1);
      }
      
      // Check if hospital accepts eligible schemes
      const acceptedSchemes = eligibleSchemes.filter(scheme => 
        hospital.pmjay_empanelled && (scheme.name.includes('PM-JAY') || scheme.name.includes('Aarogya'))
      );
      
      return {
        hospital_id: hospital._id,
        name: hospital.name,
        address: hospital.address,
        district: hospital.district,
        type: hospital.type,
        specialties: hospital.specialties,
        phone: hospital.phone,
        estimated_cost: `₹${estimatedCost.low.toLocaleString('en-IN')} - ₹${estimatedCost.high.toLocaleString('en-IN')}`,
        cost_low: estimatedCost.low,
        cost_high: estimatedCost.high,
        distance: distance ? `${distance} km` : 'N/A',
        distance_km: distance ? parseFloat(distance) : 999,
        schemes: acceptedSchemes,
        pmjay_empanelled: hospital.pmjay_empanelled,
        avg_duration: costData.avg_duration_days
      };
    });
    
    // Sort by cost (low to high)
    recommendations.sort((a, b) => a.cost_low - b.cost_low);
    
    // AI Enhancement (if OpenAI available)
    let aiInsights = null;
    if (openai && recommendations.length > 0) {
      try {
        const top3 = recommendations.slice(0, 3);
        const prompt = `Analyze these hospitals for ${condition} treatment in ${location}:\n${JSON.stringify(top3, null, 2)}\n\nProvide a brief recommendation (2-3 sentences) on which hospital offers the best value considering cost, type, and schemes.`;
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150
        });
        
        aiInsights = completion.choices[0].message.content;
      } catch (error) {
        console.log('AI insights unavailable:', error.message);
      }
    }
    
    res.json({
      success: true,
      condition,
      location,
      specialties_matched: specialties,
      total_hospitals: recommendations.length,
      eligible_schemes: eligibleSchemes,
      recommendations: recommendations.slice(0, 20), // Return top 20
      ai_insights: aiInsights
    });
    
  } catch (error) {
    console.error('Error in recommend API:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get all hospitals
app.get('/api/hospitals', async (req, res) => {
  try {
    const { district, type, specialty } = req.query;
    const filter = {};
    
    if (district) filter.district = new RegExp(district, 'i');
    if (type) filter.type = type;
    if (specialty) filter.specialties = new RegExp(specialty, 'i');
    
    const hospitals = await db.collection('hospitals').find(filter).limit(20).toArray();
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get hospital by ID
app.get('/api/hospitals/:id', async (req, res) => {
  try {
    const hospital = await db.collection('hospitals').findOne({ _id: new ObjectId(req.params.id) });
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    
    // Get relevant costs
    const costs = await db.collection('costs').find({
      category: { $in: hospital.specialties }
    }).toArray();
    
    res.json({ ...hospital, available_procedures: costs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get all schemes
app.get('/api/schemes', async (req, res) => {
  try {
    const schemes = await db.collection('schemes').find({}).toArray();
    res.json(schemes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Check eligibility
app.post('/api/eligibility-check', async (req, res) => {
  try {
    const userProfile = req.body;
    const schemes = await db.collection('schemes').find({}).toArray();
    const eligible = checkSchemeEligibility(userProfile, schemes);
    
    res.json({ eligible });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get treatment costs
app.get('/api/costs', async (req, res) => {
  try {
    const { category, procedure } = req.query;
    const filter = {};
    
    if (category) filter.category = new RegExp(category, 'i');
    if (procedure) filter.procedure = new RegExp(procedure, 'i');
    
    const costs = await db.collection('costs').find(filter).toArray();
    res.json(costs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mongodb: db ? 'connected' : 'disconnected',
    openai: openai ? 'enabled' : 'disabled'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 MongoDB: ${MONGODB_URI}`);
  console.log(`🤖 OpenAI: ${openai ? 'Enabled' : 'Disabled (using fallback logic)'}`);
});
