import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { register, login, authenticateToken } from './auth.js';
import { readPhotos, writePhotos, readUsers, writeUsers } from './utils.js';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Authentication routes
app.post('/api/register', register);
app.post('/api/login', login);

// Photo routes
app.get('/api/photos', async (req, res) => {
  try {
    const photos = await readPhotos();
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/photos', authenticateToken, async (req, res) => {
  try {
    const { title, description, image, tags } = req.body;
    const photos = await readPhotos();
    
    const newPhoto = {
      id: Date.now().toString(),
      title,
      description,
      image, // Base64 encoded image
      tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
      userId: req.user.id,
      username: req.user.username,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString()
    };
    
    photos.push(newPhoto);
    await writePhotos(photos);
    
    res.status(201).json(newPhoto);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/photos/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const photos = await readPhotos();
    const photoIndex = photos.findIndex(photo => photo.id === id);
    
    if (photoIndex === -1) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    const likeIndex = photos[photoIndex].likes.indexOf(req.user.id);
    if (likeIndex === -1) {
      photos[photoIndex].likes.push(req.user.id);
    } else {
      photos[photoIndex].likes.splice(likeIndex, 1);
    }
    
    await writePhotos(photos);
    res.json(photos[photoIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/photos/:id/comment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const photos = await readPhotos();
    const photoIndex = photos.findIndex(photo => photo.id === id);
    
    if (photoIndex === -1) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    photos[photoIndex].comments.push({
      userId: req.user.id,
      username: req.user.username,
      text,
      createdAt: new Date().toISOString()
    });
    
    await writePhotos(photos);
    res.json(photos[photoIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/photos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const photos = await readPhotos();
    const photoIndex = photos.findIndex(photo => photo.id === id);
    
    if (photoIndex === -1) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    if (photos[photoIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this photo' });
    }
    
    photos.splice(photoIndex, 1);
    await writePhotos(photos);
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User routes
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const users = await readUsers();
    const user = users.find(user => user.id === id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't return password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
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
    
    const users = await readUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users[userIndex].username = username || users[userIndex].username;
    users[userIndex].bio = bio || users[userIndex].bio;
    users[userIndex].profilePicture = profilePicture || users[userIndex].profilePicture;
    
    await writeUsers(users);
    
    // Don't return password
    const { password, ...updatedUser } = users[userIndex];
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search route
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    const photos = await readPhotos();
    
    if (!q) {
      return res.json(photos);
    }
    
    const searchTerm = q.toLowerCase();
    const filteredPhotos = photos.filter(photo => 
      photo.title.toLowerCase().includes(searchTerm) ||
      photo.description.toLowerCase().includes(searchTerm) ||
      photo.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      photo.username.toLowerCase().includes(searchTerm)
    );
    
    res.json(filteredPhotos);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});