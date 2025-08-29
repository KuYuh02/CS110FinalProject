import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://mangelodeguzman20_db_user:bbVWsaJNfMeewhRn@snapshare.9w7rd5m.mongodb.net/snapshare';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Photo Schema
const photoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true }, // Base64 encoded image
  tags: [{ type: String }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Photo = mongoose.model('Photo', photoSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Authentication routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
      bio: '',
      profilePicture: '',
      following: [],
      followers: []
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        bio: user.bio,
        profilePicture: user.profilePicture,
        following: user.following,
        followers: user.followers
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        bio: user.bio,
        profilePicture: user.profilePicture,
        following: user.following,
        followers: user.followers
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Photo routes
app.get('/api/photos', async (req, res) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 });
    res.json(photos);
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/photos', authenticateToken, async (req, res) => {
  try {
    const { title, description, image, tags } = req.body;
    
    if (!title || !description || !image) {
      return res.status(400).json({ error: 'Title, description, and image are required' });
    }

    const photo = new Photo({
      title,
      description,
      image,
      tags: Array.isArray(tags) ? tags : (tags || '').split(',').map(tag => tag.trim()).filter(Boolean),
      userId: req.user.id,
      username: req.user.username,
      likes: [],
      comments: []
    });

    await photo.save();
    res.status(201).json(photo);
  } catch (error) {
    console.error('Create photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Edit photo (owner only)
app.put('/api/photos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image, tags } = req.body;

    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (photo.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this photo' });
    }

    const updates = {};
    if (typeof title === 'string') updates.title = title;
    if (typeof description === 'string') updates.description = description;
    if (typeof image === 'string' && image.length > 0) updates.image = image;
    if (typeof tags !== 'undefined') {
      updates.tags = Array.isArray(tags) ? tags : String(tags).split(',').map(tag => tag.trim()).filter(Boolean);
    }

    const updatedPhoto = await Photo.findByIdAndUpdate(id, updates, { new: true });
    res.json(updatedPhoto);
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/photos/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const photo = await Photo.findById(id);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    const userIdObj = new mongoose.Types.ObjectId(req.user.id);
    const likeIndex = photo.likes.findIndex(likeId => likeId.equals(userIdObj));
    
    if (likeIndex === -1) {
      photo.likes.push(userIdObj);
    } else {
      photo.likes.splice(likeIndex, 1);
    }
    
    await photo.save();
    res.json(photo);
  } catch (error) {
    console.error('Like photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/photos/:id/comment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    photo.comments.push({
      userId: req.user.id,
      username: req.user.username,
      text,
      createdAt: new Date()
    });
    
    await photo.save();
    res.json(photo);
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/photos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const photo = await Photo.findById(id);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    if (photo.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this photo' });
    }
    
    await Photo.findByIdAndDelete(id);
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User routes
// Public: get user profile by id (no password)
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id.toString(),
      username: user.username,
      bio: user.bio,
      profilePicture: user.profilePicture,
      following: user.following,
      followers: user.followers,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public: get all photos for a given user id
app.get('/api/users/:id/photos', async (req, res) => {
  try {
    const { id } = req.params;
    const photos = await Photo.find({ userId: id }).sort({ createdAt: -1 });
    res.json(photos);
  } catch (error) {
    console.error('Get user photos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, bio, profilePicture } = req.body;
    
    if (req.user.id !== id) {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }
    
    const updates = {};
    if (username) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (profilePicture !== undefined) updates.profilePicture = profilePicture;
    
    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id.toString(),
      username: user.username,
      bio: user.bio,
      profilePicture: user.profilePicture,
      following: user.following,
      followers: user.followers,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Follow/unfollow a user
app.post('/api/users/:id/follow', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params; // user to follow/unfollow
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const [targetUser, actorUser] = await Promise.all([
      User.findById(id),
      User.findById(req.user.id)
    ]);

    if (!targetUser || !actorUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetIdObj = new mongoose.Types.ObjectId(id);
    const actorIdObj = new mongoose.Types.ObjectId(req.user.id);
    
    const alreadyFollowing = actorUser.following.some(followId => followId.equals(targetIdObj));

    if (alreadyFollowing) {
      // Unfollow
      actorUser.following = actorUser.following.filter(followId => !followId.equals(targetIdObj));
      targetUser.followers = targetUser.followers.filter(followId => !followId.equals(actorIdObj));
    } else {
      // Follow
      actorUser.following.push(targetIdObj);
      targetUser.followers.push(actorIdObj);
    }

    await Promise.all([actorUser.save(), targetUser.save()]);

    res.json({ 
      user: {
        id: actorUser._id.toString(),
        username: actorUser.username,
        bio: actorUser.bio,
        profilePicture: actorUser.profilePicture,
        following: actorUser.following,
        followers: actorUser.followers
      },
      following: !alreadyFollowing
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search route
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      // Default: return all photos and empty users list
      const photos = await Photo.find().sort({ createdAt: -1 });
      return res.json({ photos, users: [] });
    }
    
    const searchTerm = q.toLowerCase();
    const searchRegex = new RegExp(searchTerm, 'i');
    
    const [photos, users] = await Promise.all([
      Photo.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } },
          { username: searchRegex }
        ]
      }).sort({ createdAt: -1 }),
      User.find({
        $or: [
          { username: searchRegex },
          { bio: searchRegex }
        ]
      }).select('-password')
    ]);
    
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      bio: user.bio,
      profilePicture: user.profilePicture,
      following: user.following,
      followers: user.followers
    }));
    
    res.json({ photos, users: formattedUsers });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});