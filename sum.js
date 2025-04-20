const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

// Create the express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/act-sections', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Define the Act and Section schemas
const ActSchema = new mongoose.Schema({
  name: String,
  content: String,
});

const SectionSchema = new mongoose.Schema({
  name: String,
  text: String,
  actId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Act"
  }
});

// Create models for Act and Section
const Act = mongoose.model("Act", ActSchema);
const Section = mongoose.model("Section", SectionSchema);

// Routes

// Fetch acts (Maharashtra or Indian Acts)
app.get("/acts/:type", async (req, res) => {
  try {
    const { type } = req.params;

    // Fetch acts based on type (you may want to adjust based on your actual data model)
    const acts = await Act.find({ content: new RegExp(type, "i") }); // Use regular expression to match content by type
    res.json(acts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to fetch acts" });
  }
});

// Fetch sections of a specific act
app.get("/sections/:actId", async (req, res) => {
  try {
    const { actId } = req.params;

    // Find all sections that belong to the specified actId
    const sections = await Section.find({ actId: mongoose.Types.ObjectId(actId) });
    res.json(sections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to fetch sections" });
  }
});

// Update section text (when the user edits the section)
app.put("/sections/:sectionId", async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { text } = req.body; // Get the updated text from the request body

    // Find the section by ID and update its text
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { text },
      { new: true }
    );

    if (!updatedSection) {
      return res.status(404).json({ error: "Section not found" });
    }

    res.json(updatedSection);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to update section" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
