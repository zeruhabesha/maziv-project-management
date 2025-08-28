'use strict';

const Sequelize = require('sequelize');
const process = require('process');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.cjs')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Explicitly require all models
const User = require('./user.cjs')(sequelize, Sequelize.DataTypes);
const Item = require('./item.cjs')(sequelize, Sequelize.DataTypes);
const Project = require('./project.cjs')(sequelize, Sequelize.DataTypes);
const Phase = require('./phase.cjs')(sequelize, Sequelize.DataTypes);
const Budget = require('./budget.cjs')(sequelize, Sequelize.DataTypes);
const Alert = require('./alert.cjs')(sequelize, Sequelize.DataTypes);
const Supplier = require('./supplier.cjs')(sequelize, Sequelize.DataTypes);
const Notification = require('./notification.cjs')(sequelize, Sequelize.DataTypes);

db.User = User;
db.Item = Item;
db.Project = Project;
db.Phase = Phase;
db.Budget = Budget;
db.Alert = Alert;
db.Supplier = Supplier;
db.Notification = Notification;

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Call associate for each model if it exists
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;