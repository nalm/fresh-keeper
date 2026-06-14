import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'db.json');

class JSONDatabase {
  constructor() {
    this.data = { items: [] };
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const rawData = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(rawData);
      } else {
        this.save();
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      this.data = { items: [] };
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  getItems() {
    return this.data.items;
  }

  getItem(id) {
    return this.data.items.find(item => item.id === id);
  }

  addItem(item) {
    const newItem = {
      id: item.id || Date.now().toString(),
      name: item.name || '이름 없음',
      expirationDate: item.expirationDate || new Date().toISOString().split('T')[0],
      status: item.status || 'active', // active | consumed
      addedAt: new Date().toISOString(),
      ...item
    };
    this.data.items.push(newItem);
    this.save();
    return newItem;
  }

  updateItem(id, updates) {
    const index = this.data.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data.items[index] = {
        ...this.data.items[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.items[index];
    }
    return null;
  }

  deleteItem(id) {
    const index = this.data.items.findIndex(item => item.id === id);
    if (index !== -1) {
      const deleted = this.data.items.splice(index, 1)[0];
      this.save();
      return deleted;
    }
    return null;
  }
}

const db = new JSONDatabase();
export default db;
