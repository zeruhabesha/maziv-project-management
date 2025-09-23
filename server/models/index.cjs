// server/models/index.cjs
const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.cjs');
const basename = path.basename(__filename);

const db = {};
fs.readdirSync(__dirname)
  .filter(file => (
    file.indexOf('.') !== 0 &&
    file !== basename &&
    (file.endsWith('.js') || file.endsWith('.cjs')) &&
    !file.endsWith('.map')
  ))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// Wire associations
Object.keys(db).forEach(name => {
  if (db[name].associate) {
    db[name].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = require('sequelize').Sequelize;

module.exports = db;
