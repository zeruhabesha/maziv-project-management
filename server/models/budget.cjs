'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Budget extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Budget.belongsTo(models.Project, { foreignKey: 'project_id', as: 'Project' });
    }
  }
  Budget.init({
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'Project ID cannot be null' }
      }
    },
    category: DataTypes.STRING,
    budgeted_amount: DataTypes.DECIMAL(15, 2),
    actual_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Budget',
    tableName: 'budgets',
  });
  return Budget;
};