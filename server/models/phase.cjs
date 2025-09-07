// server/models/phase.cjs
module.exports = (sequelize, DataTypes) => {
  const Phase = sequelize.define('Phase', {
    id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:           { type: DataTypes.STRING, allowNull: false },
    sequence_order: { type: DataTypes.INTEGER },
    createdAt:      { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
    updatedAt:      { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
  }, {
    tableName: 'Phases',
    freezeTableName: true,
    schema: 'public',
    timestamps: true,
  });

  Phase.associate = (models) => {
    Phase.hasMany(models.Item, { foreignKey: 'phase_id', as: 'Items', onUpdate: 'SET NULL', onDelete: 'SET NULL' });
  };

  return Phase;
};
