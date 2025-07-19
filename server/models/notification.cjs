'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, { foreignKey: 'user_id', as: 'User' });
    }
  }
  Notification.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    type: DataTypes.STRING,
    message: DataTypes.TEXT,
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
  });
  return Notification;
}; 