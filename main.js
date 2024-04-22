function init() {
    console.log('Custom extension initialized');
    app.factory.on('elementCreated', function (newElement) {
      console.log('Element created:', newElement);
      if (newElement instanceof app.type.BPMNElement) {
        console.log('BPMN element created:', newElement);
        newElement.id = generateUniqueId(); // Replace this with your ID generation logic
      }
    });
  }
  
  function generateUniqueId() {
    // Implement your unique ID generation logic here
    console.log('Unique ID generation logic not implemented');
    return 'unique-id';
  }
  
  exports.init = init;