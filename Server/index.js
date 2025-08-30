import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://mangelodeguzman20_db_user:bbVWsaJNfMeewhRn@snapshare.9w7rd5m.mongodb.net/snapshare';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Handle existing users without email field
mongoose.connection.once('open', async () => {
  try {
    const User = mongoose.model('User');
    const usersWithoutEmail = await User.find({ email: { $exists: false } });
    
    if (usersWithoutEmail.length > 0) {
      console.log(`Found ${usersWithoutEmail.length} users without email field, updating...`);
      
      for (const user of usersWithoutEmail) {
        // Generate a default email if none exists
        const defaultEmail = `${user.username}@example.com`;
        await User.updateOne(
          { _id: user._id },
          { $set: { email: defaultEmail } }
        );
      }
      
      console.log('Updated existing users with default email');
    }
  } catch (error) {
    console.error('Error updating existing users:', error);
  }
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
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

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Ensure req.user has the correct structure
    req.user = {
      id: decoded.id,
      username: decoded.username
    };
    
    next();
  });
};

// Authentication routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
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
        email: user.email,
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
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
        email: user.email,
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

// Photos
app.get("/api/photos", async (req, res) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 });
    
    // Convert ObjectIds to strings for client-side compatibility
    const formattedPhotos = photos.map(photo => {
      console.log('Processing photo:', photo.title);
      console.log('Photo comments before formatting:', photo.comments);
      
      const formattedPhoto = {
        ...photo.toObject(),
        id: photo._id.toString(),
        userId: photo.userId.toString(),
        likes: photo.likes.map(likeId => likeId.toString()),
        comments: photo.comments.map(comment => {
          console.log('Processing comment:', comment);
          return {
            userId: comment.userId.toString(),
            username: comment.username,
            text: comment.text,
            createdAt: comment.createdAt
          };
        })
      };
      
      console.log('Formatted photo comments:', formattedPhoto.comments);
      return formattedPhoto;
    });
    
    console.log('Formatted photos for client:', formattedPhotos);
    res.json(formattedPhotos);
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/api/photos", authenticateToken, async (req, res) => {
  try {
    console.log('Create photo request - req.user:', req.user);
    console.log('Request body:', req.body);
    
    const { title, description, image, tags } = req.body;
    
    if (!title || !description || !image) {
      return res.status(400).json({ error: 'Title, description, and image are required' });
    }

    const photo = new Photo({
      title,
      description,
      image,
      tags: Array.isArray(tags) ? tags : (tags || '').split(',').map(tag => tag.trim()).filter(Boolean),
      userId: new mongoose.Types.ObjectId(req.user.id),
      username: req.user.username,
      likes: [],
      comments: []
    });

    console.log('Photo object before save:', photo);

    await photo.save();
    console.log('Photo saved successfully:', photo);
    
    // Format the response for client-side compatibility
    const formattedPhoto = {
      ...photo.toObject(),
      id: photo._id.toString(),
      userId: photo.userId.toString(),
      likes: photo.likes.map(likeId => likeId.toString()),
      comments: photo.comments.map(comment => ({
        userId: comment.userId.toString(),
        username: comment.username,
        text: comment.text,
        createdAt: comment.createdAt
      }))
    };
    
    console.log('Formatted photo response:', formattedPhoto);
    res.status(201).json(formattedPhoto);
  } catch (error) {
    console.error('Create photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Edit photo (owner only)
app.put('/api/photos/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Update photo request - req.user:', req.user);
    console.log('Photo ID:', req.params.id);
    console.log('Request body:', req.body);
    
    const { id } = req.params;
    const { title, description, image, tags } = req.body;

    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    console.log('Photo found:', photo);
    console.log('Photo userId:', photo.userId);
    console.log('req.user.id:', req.user.id);
    console.log('Photo userId type:', typeof photo.userId);
    console.log('req.user.id type:', typeof req.user.id);

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
    
    // Format the response for client-side compatibility
    const formattedPhoto = {
      ...updatedPhoto.toObject(),
      id: updatedPhoto._id.toString(),
      userId: updatedPhoto.userId.toString(),
      likes: updatedPhoto.likes.map(likeId => likeId.toString()),
      comments: updatedPhoto.comments.map(comment => ({
        userId: comment.userId.toString(),
        username: comment.username,
        text: comment.text,
        createdAt: comment.createdAt
      }))
    };
    
    res.json(formattedPhoto);
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/photos/:id/like', authenticateToken, async (req, res) => {
  try {
    console.log('Like photo request - req.user:', req.user);
    console.log('Photo ID:', req.params.id);
    
    const { id } = req.params;
    const photo = await Photo.findById(id);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    console.log('Photo found:', photo);
    console.log('Photo userId:', photo.userId);
    console.log('req.user.id:', req.user.id);
    
    const userIdObj = new mongoose.Types.ObjectId(req.user.id);
    const likeIndex = photo.likes.findIndex(likeId => likeId.equals(userIdObj));
    
    if (likeIndex === -1) {
      photo.likes.push(userIdObj);
      console.log('Added like for user:', req.user.id);
    } else {
      photo.likes.splice(likeIndex, 1);
      console.log('Removed like for user:', req.user.id);
    }
    
    await photo.save();
    
    // Format the response for client-side compatibility
    const formattedPhoto = {
      ...photo.toObject(),
      id: photo._id.toString(),
      userId: photo.userId.toString(),
      likes: photo.likes.map(likeId => likeId.toString()),
      comments: photo.comments.map(comment => ({
        userId: comment.userId.toString(),
        username: comment.username,
        text: comment.text,
        createdAt: comment.createdAt
      }))
    };
    
    res.json(formattedPhoto);
  } catch (error) {
    console.error('Like photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/photos/:id/comment', authenticateToken, async (req, res) => {
  try {
    console.log('Comment request - req.user:', req.user);
    console.log('Photo ID:', req.params.id);
    console.log('Comment text:', req.body.text);
    
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    const newComment = {
      userId: new mongoose.Types.ObjectId(req.user.id),
      username: req.user.username,
      text,
      createdAt: new Date()
    };
    
    console.log('New comment object:', newComment);
    photo.comments.push(newComment);
    
    console.log('Added comment for user:', req.user.id, 'with username:', req.user.username);
    console.log('Photo comments after adding:', photo.comments);
    
    await photo.save();
    console.log('Photo saved with comments:', photo.comments);
    
    // Format the response for client-side compatibility
    const formattedPhoto = {
      ...photo.toObject(),
      id: photo._id.toString(),
      userId: photo.userId.toString(),
      likes: photo.likes.map(likeId => likeId.toString()),
      comments: photo.comments.map(comment => {
        console.log('Formatting comment in response:', comment);
        return {
          userId: comment.userId.toString(),
          username: comment.username,
          text: comment.text,
          createdAt: comment.createdAt
        };
      })
    };
    
    console.log('Final formatted photo response:', formattedPhoto);
    res.json(formattedPhoto);
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/photos/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Delete photo request - req.user:', req.user);
    console.log('Photo ID:', req.params.id);
    
    const { id } = req.params;
    const photo = await Photo.findById(id);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    console.log('Photo found:', photo);
    console.log('Photo userId:', photo.userId);
    console.log('req.user.id:', req.user.id);

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
      email: user.email,
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
    
    // Format photos for client-side compatibility
    const formattedPhotos = photos.map(photo => ({
      ...photo.toObject(),
      id: photo._id.toString(),
      userId: photo.userId.toString(),
      likes: photo.likes.map(likeId => likeId.toString()),
      comments: photo.comments.map(comment => ({
        userId: comment.userId.toString(),
        username: comment.username,
        text: comment.text,
        createdAt: comment.createdAt
      }))
    }));
    
    res.json(formattedPhotos);
  } catch (error) {
    console.error('Get user photos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, bio, profilePicture } = req.body;
    
    if (req.user.id !== id) {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }
    
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (bio !== undefined) updates.bio = bio;
    if (profilePicture !== undefined) updates.profilePicture = profilePicture;
    
    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
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
      return res.status(400).json({ error: 'Username or email already exists' });
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
        email: actorUser.email,
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
      
      // Format photos for client-side compatibility
      const formattedPhotos = photos.map(photo => ({
        ...photo.toObject(),
        id: photo._id.toString(),
        userId: photo.userId.toString(),
        likes: photo.likes.map(likeId => likeId.toString()),
        comments: photo.comments.map(comment => ({
          userId: comment.userId.toString(),
          username: comment.username,
          text: comment.text,
          createdAt: comment.createdAt
        }))
      }));
      
      return res.json({ photos: formattedPhotos, users: [] });
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
    
    // Format photos for client-side compatibility
    const formattedPhotos = photos.map(photo => ({
      ...photo.toObject(),
      id: photo._id.toString(),
      userId: photo.userId.toString(),
      likes: photo.likes.map(likeId => likeId.toString()),
      comments: photo.comments.map(comment => ({
        userId: comment.userId.toString(),
        username: comment.username,
        text: comment.text,
        createdAt: comment.createdAt
      }))
    }));
    
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      bio: user.bio,
      profilePicture: user.profilePicture,
      following: user.following,
      followers: user.followers
    }));
    
    res.json({ photos: formattedPhotos, users: formattedUsers });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});