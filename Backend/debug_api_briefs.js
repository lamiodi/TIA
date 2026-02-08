import axios from 'axios';

const testApi = async () => {
  try {
    console.log('Fetching /shopall?category=briefs');
    // Assuming server is running on localhost:5000 (based on package.json/server.js)
    const res = await axios.get('http://localhost:5000/api/shopall?category=briefs');
    
    console.log(`Status: ${res.status}`);
    console.log(`Found ${res.data.length} items.`);
    
    const briefs = res.data.filter(item => item.is_product);
    console.log(`Found ${briefs.length} products.`);
    
    briefs.forEach(p => {
      console.log(`- [${p.id}] ${p.name} (${p.category}, ${p.gender})`);
    });

  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
  }
};

testApi();
