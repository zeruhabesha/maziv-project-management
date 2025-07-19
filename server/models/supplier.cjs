'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Supplier extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Supplier.hasMany(models.Item, { foreignKey: 'supplier_id', as: 'Items' });
    }
  }
  Supplier.init({
    company: DataTypes.STRING, // <-- this should match the column name in your DB
    contact_name: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    address: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Supplier',
    tableName: 'suppliers',
  });
  return Supplier;
};