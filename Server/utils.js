import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, 'data');

const readJSON = async (filename) => {
  try {
    const filePath = path.join(dataPath, filename);
    console.log(`Attempting to read from: ${filePath}`);
    const data = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(data);
    console.log(`Successfully read ${filename}, data length: ${parsed.length}`);
    return parsed;
  } catch (error) {
    console.log(`Error reading ${filename}:`, error.message);
    return [];
  }
};

const writeJSON = async (filename, data) => {
  try {
    // Ensure data directory exists
    console.log(`Ensuring data directory exists: ${dataPath}`);
    await fs.mkdir(dataPath, { recursive: true });
    
    const filePath = path.join(dataPath, filename);
    console.log(`Writing to file: ${filePath}`);
    console.log(`Data to write:`, JSON.stringify(data, null, 2));
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Successfully wrote to ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error writing file ${filename}:`, error);
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