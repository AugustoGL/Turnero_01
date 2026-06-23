const express = require('express');
const listEndpoints = require('express-list-endpoints');

const app = express();

// IMPORTA tu app real si la tenés separada
// const app = require('./app');

console.log(listEndpoints(app));




