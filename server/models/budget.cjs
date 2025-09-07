// server/models/budget.cjs
module.exports = (sequelize, DataTypes) => {
  const Budget = sequelize.define('Budget', {
    id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    project_id: { type: DataTypes.INTEGER, allowNull: false },
    category:   { type: DataTypes.STRING },      // e.g., materials, labor, logistics
    amount:     { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 },
    notes:      { type: DataTypes.TEXT },
    createdAt:  { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
    updatedAt:  { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
  }, {
    tableName: 'Budgets',            // ensure your migration matches this table name
    freezeTableName: true,
    schema: 'public',
    timestamps: true,
  });

  Budget.associate = (models) => {
    Budget.belongsTo(models.Project, { foreignKey: 'project_id', as: 'Project', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
  };

  return Budget;
};
