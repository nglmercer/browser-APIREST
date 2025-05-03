import fs from 'fs';

class JSONStore {
  constructor(filename = '', autoSave = false) {
    this.store = new Map();
    this.filename = filename;
    this.autoSave = autoSave;
    
    if (filename) {
      this.ensureFileExists();
      this.loadFromFile();
    }
  }

  set(key, value) {
    if (typeof key !== 'string') {
      throw new Error('La clave debe ser un string');
    }
    
    // Validar que el valor sea serializable
    try {
      JSON.stringify(value);
    } catch (error) {
      throw new Error('El valor no es serializable a JSON');
    }
    
    this.store.set(key, value);
    
    if (this.autoSave && this.filename) {
      this.saveToFile();
    }
    
    return this;
  }

  get(key) {
    return this.store.get(key);
  }

  delete(key) {
    return this.store.delete(key);
  }

  has(key) {
    return this.store.has(key);
  }

  toJSON() {
    const obj = {};
    this.store.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  ensureFileExists() {
    try {
      if (!fs.existsSync(this.filename)) {
        fs.writeFileSync(this.filename, '{}', 'utf8');
      }
      
      // Validar que el archivo contiene JSON válido
      const content = fs.readFileSync(this.filename, 'utf8');
      JSON.parse(content);
    } catch (error) {
      throw new Error(`Error al validar/crear el archivo ${this.filename}: ${error.message}`);
    }
  }
  
  loadFromFile() {
    try {
      const content = fs.readFileSync(this.filename, 'utf8');
      const data = JSON.parse(content);
      
      for (const key in data) {
        this.store.set(key, data[key]);
      }
    } catch (error) {
      throw new Error(`Error al cargar datos del archivo ${this.filename}: ${error.message}`);
    }
  }
  
  saveToFile() {
    try {
      fs.writeFileSync(this.filename, JSON.stringify(this.toJSON(), null, 2), 'utf8');
    } catch (error) {
      throw new Error(`Error al guardar datos en el archivo ${this.filename}: ${error.message}`);
    }
  }
  
  static fromJSON(json) {
    const store = new JSONStore();
    for (const key in json) {
      store.set(key, json[key]);
    }
    return store;
  }
}

export default JSONStore;