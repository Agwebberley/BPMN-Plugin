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

  addElement(element) {
    // Check if the element ID already exists
    const existingElement = this.getElementById(element.id);
    if (existingElement) {
      console.log('Element with ID', element.id, 'already exists');
      return;
    }
    this.elements.push(element);
    this.SaveToFile();
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
    this.SaveToFile();
  }

  deleteElement(element) {
    const index = this.elements.findIndex(e => e.id === element.id);
    this.elements.splice(index, 1);
    this.SaveToFile();
  }

  deleteElementById(id) {
    const index = this.elements.findIndex(e => e.id === id);
    this.elements.splice(index, 1);
    this.SaveToFile();
  }

  SaveToFile() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.elements));
  }
}



function init() {
  console.log('Custom extension initialized');
  const fileManager = new FileManager(path.join(__dirname, 'elements.json'));
  global.fileManager = fileManager;
  // Start the event listeners
  eventListeners();
    
}

function eventListeners() {
// Check if the model is an instance of BPMNBaseElement
  app.factory.on('elementCreated', function (model, view) {
  console.log('Element created:', model, view);
    let proto = model;
    while (proto) {
      console.log(proto.constructor.name);
      if (proto.constructor.name === 'BPMNBaseElement') {
        console.log('BPMNBaseElement found in the prototype chain');
        // Generate a unique ID
        model.id = generateId();
        // Add hidden tags to the element
        generateTags(model);
        console.log('Generated ID:', model.id);
        // Add the element to the fileManager
        addElement(model);
      }
      proto = Object.getPrototypeOf(proto);
    }
  });
}

function generateId() {
    // Get the current max ID from the elements
    const maxId = Math.max(...fileManager.getElements().map(element => element.id));
    return maxId + 1;
}


function generateTags(model) {
  // Generate tags for the element
  // Hidden Tags for the element
  // [elementName , elementId, created = false,  ]

  // Create a tag for the element name
  var nameTag = app.factory.createModel({
    id: "Name",
    parent: model,
    field: "tags",
    modelInitializer: function (tag) {
      tag.kind = type.Tag.TK_HIDDEN;
      tag.value = model.name;
    }
  });

  // Create a tag for the element ID
  var idTag = app.factory.createModel({
    id: "ID",
    parent: model,
    field: "tags",
    modelInitializer: function (tag) {
      tag.kind = type.Tag.TK_HIDDEN;
      tag.value = model.id;
    }
  });

  // Create a tag for the element created by the extension
  var createdTag = app.factory.createModel({
    parent: model,
    field: "tags",
    modelInitializer: function (tag) {
      tag.name = "Created";
      tag.kind = type.Tag.TK_HIDDEN;
      tag.value = false;
    }
  });
}

function getTagValue(model, tagName) {
  const tag = model.tags.find(tag => tag.name === tagName);
  if (tag) {
    console.log(`Tag ${tagName} found`);
    return tag.value;
  } else {
    console.log(`Tag ${tagName} not found`);
    return null;
  }
}

function setTagValue(model, tagName, value) {
  const tag = model.tags.find(tag => tag.name === tagName);
  if (tag) {
    tag.value = value;
  } else {
    console.log(`Tag ${tagName} not found`);
  }
}

// Add element to the fileManager
function addElement(model) {
  /* 
  Example of an element
  {
    id: getTagValue(model, 'ID'),
    name: getTagValue(model, 'Name'),
    created: true
    prototype: model.constructor.name
  }
  */
  const element = {
    id: getTagValue(model, 'ID'),
    name: getTagValue(model, 'Name'),
    created: true,
    prototype: model.constructor.name
  }
  fileManager.addElement(element);
}

exports.init = init;