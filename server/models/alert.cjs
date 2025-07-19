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
      allowNull: false,
      validate: {
        notNull: { msg: 'Item ID cannot be null' }
      }
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'Project ID cannot be null' }
      }
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
    }
  }, {
    sequelize,
    modelName: 'Alert',
    tableName: 'alerts',
  });
  return Alert;
};