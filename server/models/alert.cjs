'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Alert extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Alert.belongsTo(models.Item, { foreignKey: 'item_id', as: 'Item' });
      Alert.belongsTo(models.Project, { foreignKey: 'project_id', as: 'Project' });
    }
  }
  Alert.init({
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for user-specific alerts
      references: { model: 'Item', key: 'id' }
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for general alerts
      references: { model: 'Project', key: 'id' }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'Type cannot be null' },
        notEmpty: { msg: 'Type cannot be empty' }
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: { msg: 'Message cannot be null' },
        notEmpty: { msg: 'Message cannot be empty' }
      }
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    triggered_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'User', key: 'id' }
    }
  }, {
    sequelize,
    modelName: 'Alert',
    tableName: 'alerts',
  });
  return Alert;
};