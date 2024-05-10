// TODO: Add a keybinding to search for elements
// TODO: Create element when the user selects an element from the panel
// TODO: Update panel when an element is created
// TODO: Warn if the user tries to rename an element the standard way
// TODO: Open rename dialog when the user creates a new element

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
  const fileManager = new FileManager(path.join(app.getUserPath(), 'elements.json'));
  global.fileManager = fileManager;
  


  // Start the event listeners
  eventListeners();
  // Call the createPanel function to create the panel
  createPanel();
    
}

function eventListeners() {
// Check if the model is an instance of BPMNBaseElement
  app.factory.on('elementCreated', function (model, view) {
  console.log('Element created:', model, view);
    let proto = model;
    while (proto) {
      if (proto.constructor.name === 'BPMNBaseElement') {
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

  // Listen for the rename event created by panel.html
  document.addEventListener('rename', function (Event) {
    console.log(Event.detail);
    // Create dialog to ask for the new name
    app.dialogs.showInputDialog("Enter the new name.").then(function ({buttonId, returnValue}) {
      console.log(buttonId)
      if (buttonId === 'ok') {
        // Get the new name from the input
        const newName = returnValue;
        // Check if any other element has the same name
        const existingElement = fileManager.getElementByName(newName);
        if (existingElement) {
          app.dialogs.showAlertDialog(`An element with name ${newName} already exists.`)

          console.log('Element with name', newName, 'already exists');
          return;
        }
        // Get the element by ID
        const element = fileManager.getElementById(Event.detail.id);
        // Update the element name
        element.name = newName;
        // Update the element in the fileManager
        fileManager.updateElement(element);

        // Rename all the elements in the diagram with matching ID
        const elements = app.repository.select(`[id=${Event.detail.id}]`);
        elements.forEach(model => {
          model.name = newName;
          setTagValue(model, 'Name', newName);
        });
        // Emit an event to update the panel
        const event = new CustomEvent('renameSuccess', {detail: {id: Event.detail.id, name: newName}});
        document.dispatchEvent(event);
      } else {
        console.log('Dialog canceled');
      }
    });
  });


  // No event is emitted when an element's name is changed
  // How could we listen to this event?
  
  
}

function generateId() {
    // Get the current max ID from the elements
    const maxId = Math.max(...fileManager.getElements().map(element => element.id));
    // handle the case where there are no elements
    if (maxId === -Infinity) {
      return 0;
    }
    return maxId + 1;
}


function generateTags(model) {
  // Generate tags for the element
  // Hidden Tags for the element
  // [elementName , elementId, created = false,  ]

  // Create a tag for the element name
  app.factory.createModel({
    id: "Tag",
    parent: model,
    field: "tags",
    modelInitializer: function (tag) {
      tag.name = "Name";
      tag.kind = type.Tag.TK_HIDDEN;
      tag.value = model.name;
    }
  });

  app.factory.createModel({
    id: "Tag",
    parent: model,
    field: "tags",
    modelInitializer: function (tag) {
      tag.name = "ID";
      tag.kind = type.Tag.TK_HIDDEN;
      tag.value = model.id;
    }
  });
}

function getTagValue(model, tagName) {
  const tag = model.tags.find(tag => tag.name === tagName);
  if (tag) {
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

/**
Docs for creating a panel
 PanelManager

new PanelManager()
Instance Members
▾ createBottomPanel(id, $panel, minSize)
Creates a new panel beneath the editor area and above the status bar footer. Panel is initially invisible.

createBottomPanel(id: string, $panel: jQueryObject, minSize: number): Panel
Parameters
id (string) Unique id for this panel. Use package-style naming, e.g. "myextension.feature.panelname"
$panel (jQueryObject) DOM content to use as the panel. Need not be in the document yet.
minSize (number) Minimum height of panel in px.
Returns
Panel:
 */
// Create a panel to search for elements
// Create a panel to search for elements
function createPanel() {
  const panelManager = app.panelManager;
  // Use Panel.html as the content of the panel
  const $panel = $(fs.readFileSync(path.join(__dirname, 'panel.html'), 'utf8'));
  const panel = panelManager.createBottomPanel('custom-extension.search', $panel, 200);
  panel.show();
}

exports.init = init;