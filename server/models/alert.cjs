// server/models/alert.cjs
module.exports = (sequelize, DataTypes) => {
  const Alert = sequelize.define('Alert', {
    id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    project_id:   { type: DataTypes.INTEGER },
    item_id:      { type: DataTypes.INTEGER },
    user_id:      { type: DataTypes.INTEGER }, // added by later migration
    type:         { type: DataTypes.STRING, allowNull: false },
    message:      { type: DataTypes.TEXT, allowNull: false },
    severity:     { type: DataTypes.STRING, allowNull: false, defaultValue: 'medium' },
    triggered_at: { type: DataTypes.DATE,  allowNull: false, defaultValue: sequelize.literal('NOW()') },
    is_read:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt:    { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
    updatedAt:    { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
  }, {
    tableName: 'Alerts',
    freezeTableName: true,
    schema: 'public',
    timestamps: true,
  });

  Alert.associate = (models) => {
    Alert.belongsTo(models.Project, { foreignKey: 'project_id', as: 'Project' });
    Alert.belongsTo(models.Item,    { foreignKey: 'item_id',    as: 'Item' });
    Alert.belongsTo(models.User,    { foreignKey: 'user_id',    as: 'User' });
  };

  return Alert;
};
