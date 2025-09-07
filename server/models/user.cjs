// server/models/user.cjs
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:       { type: DataTypes.STRING, allowNull: false },
    email:      { type: DataTypes.STRING, allowNull: false, unique: true },
    password:   { type: DataTypes.STRING, allowNull: false },
    role:       { type: DataTypes.ENUM('admin', 'manager', 'user'), allowNull: false, defaultValue: 'user' },
    createdAt:  { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
    updatedAt:  { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
  }, {
    tableName: 'Users',
    freezeTableName: true,
    schema: 'public',
    timestamps: true,
    underscored: false,
  });

  User.associate = (models) => {
    User.hasMany(models.Item,         { foreignKey: 'assigned_to', as: 'AssignedItems', onUpdate: 'SET NULL', onDelete: 'SET NULL' });
    User.hasMany(models.Notification, { foreignKey: 'user_id',     as: 'Notifications', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
    User.hasMany(models.Alert,        { foreignKey: 'user_id',     as: 'Alerts',        onUpdate: 'CASCADE', onDelete: 'SET NULL' });
  };

  return User;
};
