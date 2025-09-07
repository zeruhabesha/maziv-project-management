// server/models/notification.cjs
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id:   { type: DataTypes.INTEGER, allowNull: false },
    type:      { type: DataTypes.STRING, allowNull: false },
    message:   { type: DataTypes.TEXT, allowNull: false },
    is_read:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
  }, {
    tableName: 'Notifications',
    freezeTableName: true,
    schema: 'public',
    timestamps: true,
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'user_id', as: 'User', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
  };

  return Notification;
};
