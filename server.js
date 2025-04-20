const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors({ 
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// MongoDB Connection
mongoose
  .connect("mongodb+srv://prakashprm710:prakashmane@cluster0.zjkru.mongodb.net/acts?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Schemas & Models
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  loggedIn: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
});
const User = mongoose.model("users", UserSchema);

// Group and Section Schema
const SectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  text: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const GroupSchema = new mongoose.Schema({
  actId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  description: { type: String },
  sections: [SectionSchema],
  createdAt: { type: Date, default: Date.now }
}, { collection: "groups" });

const Group = mongoose.model("Group", GroupSchema);

// Maharashtra Acts Schemas
const MaharashtraActSchema = new mongoose.Schema({
  name: String,
  content: String,
}, { collection: "maharashtra_acts" });
const MaharashtraAct = mongoose.model("maharashtra_acts", MaharashtraActSchema);

const MaharashtraSectionSchema = new mongoose.Schema({
  actId: { type: mongoose.Schema.Types.ObjectId, ref: "maharashtra_acts" },
  text: String,
  name: String,
}, { collection: "maharashtra_sections" });
const MaharashtraSection = mongoose.model("maharashtra_sections", MaharashtraSectionSchema);

// Indian Acts Schemas
const IndianActSchema = new mongoose.Schema({
  name: String,
  content: String,
}, { collection: "indian_acts" });
const IndianAct = mongoose.model("indian_acts", IndianActSchema);

const IndianSectionSchema = new mongoose.Schema({
  actId: { type: mongoose.Schema.Types.ObjectId, ref: "indian_acts" },
  text: String,
  name: String,
}, { collection: "indian_sections" });
const IndianSection = mongoose.model("indian_sections", IndianSectionSchema);

// ==================== Authentication Routes ==================== //
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const newUser = new User({ email, password });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.loggedIn) {
      return res.status(400).json({ message: "User already logged in" });
    }

    user.loggedIn = true;
    await user.save();
    res.status(200).json({
      message: "Login successful",
      loggedIn: true,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/logout", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await User.updateOne({ email }, { $set: { loggedIn: false } });
    if (result.modifiedCount > 0) {
      res.status(200).json({ message: "Logged out successfully", loggedIn: false });
    } else {
      res.status(404).json({ message: "User not found or already logged out" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ==================== Group and Section Routes ==================== //
app.get("/acts/:actId/groups", async (req, res) => {
  try {
    const groups = await Group.find({ actId: req.params.actId });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/acts/:actId/groups", async (req, res) => {
  const group = new Group({
    actId: req.params.actId,
    name: req.body.name,
    description: req.body.description
  });

  try {
    const newGroup = await group.save();
    res.status(201).json(newGroup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put("/groups/:groupId", async (req, res) => {
  try {
    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.groupId,
      { $set: { name: req.body.name, description: req.body.description } },
      { new: true }
    );
    res.json(updatedGroup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete("/groups/:groupId", async (req, res) => {
  try {
    await Group.findByIdAndDelete(req.params.groupId);
    res.json({ message: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/groups/:groupId/sections", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.sections.push({
      name: req.body.name,
      description: req.body.description,
      text: req.body.text
    });

    const updatedGroup = await group.save();
    res.status(201).json(updatedGroup.sections[updatedGroup.sections.length - 1]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put("/groups/:groupId/sections/:sectionId", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const section = group.sections.id(req.params.sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    section.name = req.body.name || section.name;
    section.description = req.body.description || section.description;
    section.text = req.body.text || section.text;

    const updatedGroup = await group.save();
    res.json(updatedGroup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete("/groups/:groupId/sections/:sectionId", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.sections.pull(req.params.sectionId);
    await group.save();
    res.json({ message: 'Section deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== Maharashtra Acts Routes ==================== //
app.get("/acts", async (req, res) => {
  try {
    const acts = await MaharashtraAct.find({});
    res.status(200).json(acts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching Maharashtra acts" });
  }
});

app.post("/acts", async (req, res) => {
  const { name, content } = req.body;
  try {
    const newAct = new MaharashtraAct({ name, content });
    await newAct.save();
    res.status(201).json({ message: "Maharashtra Act added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error adding Maharashtra act" });
  }
});

app.put("/acts/:id", async (req, res) => {
  const { id } = req.params;
  const { name, content } = req.body;
  try {
    const updatedAct = await MaharashtraAct.findByIdAndUpdate(
      id,
      { name, content },
      { new: true }
    );
    if (!updatedAct) return res.status(404).json({ message: "Maharashtra Act not found" });
    res.status(200).json({ message: "Maharashtra Act updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating Maharashtra act" });
  }
});

app.delete("/acts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await MaharashtraSection.deleteMany({ actId: id });
    const deleted = await MaharashtraAct.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Maharashtra Act not found" });
    res.status(200).json({ message: "Maharashtra Act and related sections deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Maharashtra act" });
  }
});

// ==================== Maharashtra Sections Routes ==================== //
app.get("/acts/:id/sections", async (req, res) => {
  const { id } = req.params;
  try {
    const sections = await MaharashtraSection.find({ actId: id });
    res.status(200).json(sections);
  } catch (error) {
    res.status(500).json({ message: "Error fetching Maharashtra act sections" });
  }
});

app.post("/acts/:id/sections", async (req, res) => {
  const { id } = req.params;
  const { name, text } = req.body;
  try {
    const newSection = new MaharashtraSection({ actId: id, name, text });
    await newSection.save();
    res.status(201).json({ message: "Maharashtra Act section added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error adding Maharashtra act section" });
  }
});

app.put("/sections/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { text, name } = req.body;

    let updatedSection = await MaharashtraSection.findByIdAndUpdate(
      id,
      { text, name },
      { new: true }
    );

    if (!updatedSection) {
      updatedSection = await IndianSection.findByIdAndUpdate(
        id,
        { text, name },
        { new: true }
      );
    }

    if (!updatedSection) {
      return res.status(404).json({ message: "Section not found" });
    }

    res.status(200).json({ message: "Section updated successfully" });
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({ message: "Error updating section", error: error.message });
  }
});

app.delete("/sections/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let deletedSection = await MaharashtraSection.findByIdAndDelete(id);

    if (!deletedSection) {
      deletedSection = await IndianSection.findByIdAndDelete(id);
    }

    if (!deletedSection) {
      return res.status(404).json({ message: "Section not found" });
    }

    res.status(200).json({ message: "Section deleted successfully" });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({ message: "Error deleting section", error: error.message });
  }
});

// ==================== Indian Acts Routes ==================== //
app.get("/indian-acts", async (req, res) => {
  try {
    const acts = await IndianAct.find({});
    res.status(200).json(acts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching Indian acts" });
  }
});

app.post("/indian-acts", async (req, res) => {
  const { name, content } = req.body;
  try {
    const newAct = new IndianAct({ name, content });
    await newAct.save();
    res.status(201).json({ message: "Indian Act added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error adding Indian act" });
  }
});

app.put("/indian-acts/:id", async (req, res) => {
  const { id } = req.params;
  const { name, content } = req.body;
  try {
    const updatedAct = await IndianAct.findByIdAndUpdate(
      id,
      { name, content },
      { new: true }
    );
    if (!updatedAct) return res.status(404).json({ message: "Indian Act not found" });
    res.status(200).json({ message: "Indian Act updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating Indian act" });
  }
});

app.delete("/indian-acts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await IndianSection.deleteMany({ actId: id });
    const deleted = await IndianAct.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Indian Act not found" });
    res.status(200).json({ message: "Indian Act and related sections deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Indian act" });
  }
});

// ==================== Indian Sections Routes ==================== //
app.get("/indian-acts/:id/sections", async (req, res) => {
  const { id } = req.params;
  try {
    const sections = await IndianSection.find({ actId: id });
    res.status(200).json(sections);
  } catch (error) {
    res.status(500).json({ message: "Error fetching Indian act sections" });
  }
});

app.post("/indian-acts/:id/sections", async (req, res) => {
  const { id } = req.params;
  const { name, text } = req.body;
  try {
    const newSection = new IndianSection({ actId: id, name, text });
    await newSection.save();
    res.status(201).json({ message: "Indian Act section added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error adding Indian act section" });
  }
});

// ==================== Search Routes ==================== //
app.get("/search-acts-by-name", async (req, res) => {
  const { query } = req.query;
  try {
    const results = await MaharashtraAct.find({
      name: { $regex: query, $options: "i" },
    });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Error searching Maharashtra acts" });
  }
});

app.get("/search-indian-acts-by-name", async (req, res) => {
  const { query } = req.query;
  try {
    const results = await IndianAct.find({
      name: { $regex: query, $options: "i" },
    });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Error searching Indian acts" });
  }
});

// ==================== Content Routes ==================== //
app.get('/acts/:id/content', async (req, res) => {
  try {
    const act = await MaharashtraAct.findById(req.params.id).select('name content');
    if (!act) return res.status(404).json({ success: false, message: "Act not found" });
    res.status(200).json({ success: true, name: act.name, content: act.content });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

app.get('/indian-acts/:id/content', async (req, res) => {
  try {
    const act = await IndianAct.findById(req.params.id).select('name content');
    if (!act) return res.status(404).json({ success: false, message: "Indian Act not found" });
    res.status(200).json({ success: true, name: act.name, content: act.content });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ==================== Admin/User Management ==================== //
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "email isAdmin");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

app.post("/add-user", async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const newUser = new User({ email, password });
    await newUser.save();
    res.status(201).json({ message: "User added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/make-admin", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isAdmin = true;
    await user.save();
    res.status(200).json({ message: "User promoted to admin" });
  } catch (error) {
    res.status(500).json({ message: "Error promoting user" });
  }
});

app.post("/remove-admin", async (req, res) => {
  const { email } = req.body;
  try {
    const updatedUser = await User.findOneAndUpdate(
      { email }, 
      { isAdmin: false }, 
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "Admin rights removed", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
});

app.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password" });
  }
});

app.post("/delete-user", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOneAndDelete({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user" });
  }
});

// Start Server
const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://192.168.0.104:${PORT}`);
});