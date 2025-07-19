'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Phase extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Phase.belongsTo(models.Project, { foreignKey: 'project_id', as: 'Project' });
      Phase.hasMany(models.Item, { foreignKey: 'phase_id', as: 'Items' });
    }
  }
  Phase.init({
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'Project ID cannot be null' }
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
    sequence_order: DataTypes.INTEGER,
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Phase',
    tableName: 'phases', // <-- ensure this is lowercase and matches your DB
  });
  return Phase;
};