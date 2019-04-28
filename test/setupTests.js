var FormData = require('formdata-node').default;

beforeEach(function() {
  global.FormData = FormData;
});

afterEach(function() {
  delete global.FormData;
});
