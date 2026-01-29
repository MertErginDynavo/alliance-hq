const app = require('../../src/app');

exports.handler = async (event, context) => {
  return new Promise((resolve, reject) => {
    const req = {
      method: event.httpMethod,
      url: event.path,
      headers: event.headers,
      body: event.body
    };
    
    const res = {
      statusCode: 200,
      headers: {},
      body: '',
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.headers['Content-Type'] = 'application/json';
        this.body = JSON.stringify(data);
        resolve(this);
      },
      send: function(data) {
        this.body = data;
        resolve(this);
      },
      sendFile: function(path) {
        // Static file serving için
        this.body = 'File not found';
        this.statusCode = 404;
        resolve(this);
      }
    };
    
    try {
      app(req, res);
    } catch (error) {
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      });
    }
  });
};