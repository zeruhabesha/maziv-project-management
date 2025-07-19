'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
       Project.hasMany(models.Item, { foreignKey: 'project_id', as: 'Items' });
       Project.hasMany(models.Phase, { foreignKey: 'project_id', as: 'Phases' });
       Project.hasMany(models.Budget, { foreignKey: 'project_id', as: 'Budgets' });
       Project.hasMany(models.Alert, { foreignKey: 'project_id', as: 'Alerts' });
    }
  }
  Project.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'Name cannot be null' },
        notEmpty: { msg: 'Name cannot be empty' }
      }
    },
    ref_no: {
      type: DataTypes.STRING,
      unique: true
    },
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    client: DataTypes.STRING,
    manager_ids: DataTypes.ARRAY(DataTypes.INTEGER),
    description: DataTypes.TEXT,
    tender_value: DataTypes.DECIMAL(15, 2),
    status: {
      type: DataTypes.ENUM('planning', 'active', 'completed', 'on_hold', 'cancelled'),
      defaultValue: 'planning'
    },
    file: DataTypes.STRING // Add file field for project file upload
  }, {
    sequelize,
    modelName: 'Project',
    tableName: 'projects',
  });
  return Project;
};