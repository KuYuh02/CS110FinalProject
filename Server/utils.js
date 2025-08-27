import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, 'data');

const readJSON = async (filename) => {
  try {
    const data = await fs.readFile(path.join(dataPath, filename), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeJSON = async (filename, data) => {
  try {
    await fs.writeFile(path.join(dataPath, filename), JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    return false;
  }
};

const readUsers = () => readJSON('users.json');
const writeUsers = (data) => writeJSON('users.json', data);
const readPhotos = () => readJSON('photos.json');
const writePhotos = (data) => writeJSON('photos.json', data);

export {
  readJSON,
  writeJSON,
  readUsers,
  writeUsers,
  readPhotos,
  writePhotos
};