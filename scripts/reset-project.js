#!/usr/bin/env node

/**
 * This script is used to reset the project to a blank state.
 * It removes files and directories related to the example code.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

console.log('PedalGo project reset script');
console.log('This will remove example files and reset the project.');
