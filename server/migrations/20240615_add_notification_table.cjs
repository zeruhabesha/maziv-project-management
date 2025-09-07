'use strict';

module.exports = {
  async up(qi, Sequelize) {
    const existing =
      (await qi.describeTable('Notifications').then(()=> 'Notifications').catch(()=> null)) ||
      (await qi.describeTable('notifications').then(()=> 'notifications').catch(()=> null));
    if (existing) return;

    const usersTable =
      (await qi.describeTable('Users').then(()=> 'Users').catch(()=> null)) ||
      (await qi.describeTable('users').then(()=> 'users').catch(()=> null));
    if (!usersTable) throw new Error('Users table not found');

    const target = 'Notifications';
    await qi.createTable(target, {
      id:         { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id:    {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: { tableName: usersTable, schema: 'public' }, key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      type:       { type: Sequelize.STRING, allowNull: false },
      message:    { type: Sequelize.TEXT, allowNull: false },
      is_read:    { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await qi.addIndex(target, ['user_id']);
    await qi.addIndex(target, ['type']);
    await qi.addIndex(target, ['is_read']);
  },

  async down(qi) {
    const t =
      (await qi.describeTable('Notifications').then(()=> 'Notifications').catch(()=> null)) ||
      (await qi.describeTable('notifications').then(()=> 'notifications').catch(()=> null));
    if (t) await qi.dropTable(t);
  }
};
