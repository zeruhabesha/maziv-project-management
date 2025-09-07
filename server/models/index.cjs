// server/models/index.cjs
const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const basename = path.basename(__filename);

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

// Create Sequelize instance (Postgres on Render needs SSL in prod – covered in config.json)
const sequelize = new Sequelize(
  config.database, config.username, config.password, {
    ...config,
    define: {
      // Allow models to set their own tableName, but keep identifiers quoted for CamelCase
      quoteIdentifiers: true,
    },
    logging: false,
  }
);

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
db.Sequelize = Sequelize;

module.exports = db;
