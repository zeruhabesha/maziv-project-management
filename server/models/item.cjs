'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Item extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Item.belongsTo(models.Project, { foreignKey: 'project_id', as: 'Project' });
      Item.belongsTo(models.Phase, { foreignKey: 'phase_id', as: 'Phase' });
      Item.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'Supplier' });
      Item.belongsTo(models.User, { foreignKey: 'assigned_to', as: 'AssignedTo' });
      Item.hasMany(models.Alert, { foreignKey: 'item_id', as: 'Alerts' });
    }
  }
  Item.init({
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'Project ID cannot be null' }
      }
    },
    phase_id: DataTypes.INTEGER,
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'Type cannot be null' },
        notEmpty: { msg: 'Type cannot be empty' }
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'Name cannot be null' },
        notEmpty: { msg: 'Name cannot be empty' }
      }
    },
    brand: DataTypes.STRING,
    model: DataTypes.STRING,
    specifications: DataTypes.TEXT,
    unit: DataTypes.STRING,
    quantity: DataTypes.DECIMAL(10, 2),
    unit_price: DataTypes.DECIMAL(15, 2),
    supplier_id: DataTypes.INTEGER,
    deadline: DataTypes.DATE,
    assigned_to: DataTypes.INTEGER,
    shipment_date: DataTypes.DATE,
    arrival_date: DataTypes.DATE,
    taxes: DataTypes.DECIMAL(15, 2),
    tracking_no: DataTypes.STRING,
    contractor: DataTypes.STRING,
    production_start_date: DataTypes.DATE,
    production_end_date: DataTypes.DATE,
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'on_hold', 'cancelled'),
      defaultValue: 'pending'
    },
    description: DataTypes.TEXT,
    file: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Item',
    tableName: 'items',
  });
  return Item;
};