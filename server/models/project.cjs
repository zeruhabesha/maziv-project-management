// server/models/project.cjs
module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
    id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:         { type: DataTypes.STRING, allowNull: false },
    client:       { type: DataTypes.STRING },
    status:       { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
    tender_value: { type: DataTypes.DECIMAL },
    start_date:   { type: DataTypes.DATE },
    end_date:     { type: DataTypes.DATE },
    manager_ids:  { type: DataTypes.ARRAY(DataTypes.INTEGER), defaultValue: [] },
    file:         { type: DataTypes.STRING },
    createdAt:    { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
    updatedAt:    { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
  }, {
    tableName: 'Projects',
    freezeTableName: true,
    schema: 'public',
    timestamps: true,
  });

  Project.associate = (models) => {
    Project.hasMany(models.Item,  { foreignKey: 'project_id', as: 'Items',   onUpdate: 'CASCADE', onDelete: 'CASCADE' });
    Project.hasMany(models.Alert, { foreignKey: 'project_id', as: 'Alerts',  onUpdate: 'CASCADE', onDelete: 'SET NULL' });
    // Optional: Project.hasMany(models.Budget, { foreignKey: 'project_id', as: 'Budgets' });
  };

  return Project;
};
