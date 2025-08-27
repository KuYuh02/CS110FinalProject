import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const usersPath = path.join(dataDir, 'users.json');
const photosPath = path.join(dataDir, 'photos.json');

export async function ensureDataFiles() {
  await fsp.mkdir(dataDir, { recursive: true });
  for (const p of [usersPath, photosPath]) {
    if (!fs.existsSync(p)) {
      await fsp.writeFile(p, '[]', 'utf8');
    }
  }
}

export async function loadUsers() {
  const txt = await fsp.readFile(usersPath, 'utf8');
  return JSON.parse(txt);
}
export async function saveUsers(users) {
  await fsp.writeFile(usersPath, JSON.stringify(users, null, 2));
}

export async function loadPhotos() {
  const txt = await fsp.readFile(photosPath, 'utf8');
  return JSON.parse(txt);
}
export async function savePhotos(photos) {
  await fsp.writeFile(photosPath, JSON.stringify(photos, null, 2));
}