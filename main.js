
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
  console.log(model.id)
  if (!model.id && model.id !== 0) {
    let proto = model;
    while (proto) {
      if (proto.constructor.name === 'BPMNBaseElement') {
        app.dialogs.showInputDialog("Enter a name.").then(function ({buttonId, returnValue}) {
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
            model.name = newName;
            // Emit an event to update the panel
            const event = new CustomEvent('newElement',  {detail: {id: model.id, name: newName, prototype: model.constructor.name}});
            document.dispatchEvent(event);
          } else {
            console.log('Dialog canceled');
            app.engine.deleteElements([model], [view]);
          }
        });
        // Generate a unique ID
        model.id = generateId();
        console.log('Generated ID:', model.id);
        // Add the element to the fileManager
        addElement(model);
      }
      proto = Object.getPrototypeOf(proto);
    }
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
        });
        // Emit an event to update the panel
        const event = new CustomEvent('renameSuccess', {detail: {id: Event.detail.id, name: newName}});
        document.dispatchEvent(event);

      } else {
        console.log('Dialog canceled');
      }
    });
  });
  document.addEventListener('rowClicked', function (Event) {
    // Check that the diagram is a BPMNDiagram
    if (app.diagrams.getCurrentDiagram().constructor.name !== 'BPMNDiagram') {
      console.log('Not a BPMNDiagram');
      return;
    }

    console.log(Event.detail);
    // Get the element by ID
    const element = fileManager.getElementById(Event.detail.id);
    console.log(app.diagrams.getCurrentDiagram());
    let options = {
      id: element.prototype,
      parent: app.diagrams.getCurrentDiagram()._parent, // Get current diagram
      diagram: app.diagrams.getCurrentDiagram(),
      x1: 50,
      y1: 20,
      x2: 50,
      y2: 20,
      modelInitializer: function (model) {
        model.id = element.id;
        model.name = element.name;
      }
    }
    let model = app.factory.createModelAndView(options);
  });

  // On Save event check that IDs match names, if not show a warning
  app.project.on('projectSaved', function (project) {
    const elements = fileManager.getElements();
    console.log(app.repository.select('@BPMNBaseElement'));
    // For each element in app.repository.select('@BPMNBaseElement') check if the ID matches the name
    const mismatchedElements = app.repository.select('@BPMNBaseElement').filter(model => {
      if (!model.id || !model.name) {
        return false;
      }
      const element = elements.find(e => e.id === model.id);
      return element.name !== model.name;
    });
    if (mismatchedElements.length > 0) {
      app.dialogs.showAlertDialog(`There are ${mismatchedElements.length} elements with different names in the file manager. Please update the names in the diagram to match the file manager. Note: Changing the name in the diagram will not update the name in the file.`);
    }
  });
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

// Add element to the fileManager
function addElement(model) {
  const element = {
    id: model.id,
    name: model.name,
    prototype: model.constructor.name
  }
  fileManager.addElement(element);
}

// Create a panel to search for elements
function createPanel() {
  const panelManager = app.panelManager;
  // Use Panel.html as the content of the panel
  const $panel = $(fs.readFileSync(path.join(__dirname, 'panel.html'), 'utf8'));
  const panel = panelManager.createBottomPanel('custom-extension.search', $panel, 200);
  panel.show();
}

exports.init = init;