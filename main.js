function init() {
    console.log('Custom extension initialized');
    app.factory.on('elementCreated', function (newElement) {
        console.log('Element created:', JSON.stringify(newElement));
        // Check if the element has a _parent property = 'BPMNProcess'
        // If it does, set the element's ID to a unique value
        console.log(newElement.type)
        console.log(json.stringify(newElement._parent))
        if (newElement._parent === 'BPMNProcess') {
            newElement.id = generateUniqueId();
            }
    });
  }
  
  function generateUniqueId() {
    // Implement your unique ID generation logic here
    console.log('Unique ID generation logic not implemented');
    return 'unique-id';
  }
  
  exports.init = init;