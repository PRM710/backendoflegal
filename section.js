const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(
  "mongodb+srv://prakashprm710:prakashmane@cluster0.zjkru.mongodb.net/acts?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
)
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// Schemas and Models
const sectionSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  actId: mongoose.Schema.Types.ObjectId,
  name: String,
  __Y: Number
}, { collection: 'sections' });

const indianActSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  __Y: Number
}, { collection: 'indian_acts' });

const Section = mongoose.model('Section', sectionSchema);
const IndianAct = mongoose.model('IndianAct', indianActSchema);

// API Routes
app.get('/api/sections', async (req, res) => {
  try {
    const sections = await Section.find({});
    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

app.get('/api/indian-acts', async (req, res) => {
  try {
    const indianActs = await IndianAct.find({});
    res.json(indianActs);
  } catch (error) {
    console.error('Error fetching Indian Acts:', error);
    res.status(500).json({ error: 'Failed to fetch Indian Acts' });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});