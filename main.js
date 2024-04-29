// TODO: Create searchable list of elements
// TODO: Add a keybinding to search for elements
// TODO: Add hidden tags to elements
// TODO: WARNING when element name is changed if created by the extension
// TODO: If this is a new element, and the name is changed, edit the name of the element in the file
// TODO: Save elements to file


// File Manager object
const fs = require('fs');
const path = require('path');

class FileManager {
  constructor(filePath) {
    this.filePath = filePath;
    this.elements = [];
    this.loadElements();
  }

  loadElements() {
    try {
      this.elements = JSON.parse(fs.readFileSync(this.filePath));
    } catch (e) {
      console.log('No elements found');
    }
  }

  saveElements() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.elements));
  }

  addElement(element) {
    this.elements.push(element);
  }

  getElementById(id) {
    return this.elements.find(element => element.id === id);
  }

  getElementByName(name) {
    return this.elements.find(element => element.name === name);
  }

  getElements() {
    return this.elements;
  }

  updateElement(element) {
    const index = this.elements.findIndex(e => e.id === element.id);
    this.elements[index] = element;
  }

  deleteElement(element) {
    const index = this.elements.findIndex(e => e.id === element.id);
    this.elements.splice(index, 1);
  }

  deleteElementById(id) {
    const index = this.elements.findIndex(e => e.id === id);
    this.elements.splice(index, 1);
  }
}



function init() {
  console.log('Custom extension initialized');
  const fileManager = new FileManager(path.join(__dirname, 'elements.json'));
  app.factory.on('elementCreated', function (model, view) {
    console.log('Element created:', model, view);
    
    // Check if the model is an instance of BPMNBaseElement
    let proto = model;
    while (proto) {
      console.log(proto.constructor.name);
      if (proto.constructor.name === 'BPMNBaseElement') {
        console.log('BPMNBaseElement found in the prototype chain');
        // Generate a unique ID
        model.id = generateId();
        console.log('Generated ID:', model.id);
      }
      proto = Object.getPrototypeOf(proto);
    }

  });
}

function generateId() {
    // Get the maximum ID from the stored elements
    const path = require('path');
    const filePath = path.join(__dirname, 'elements.json');
    let elements = [];
    try {
      elements = JSON.parse(fs.readFileSync(filePath
    ))} catch (e) {
      console.log('No elements found');
    }
    let maxId = 0;
    elements.forEach(function (element) {
      if (element.id > maxId) {
        maxId = element.id;
      }
    });
    return maxId + 1;
}



exports.init = init;