'use strict';

module.exports = {
  async up(qi, Sequelize) {
    const alertsTable =
      (await qi.describeTable('Alerts').then(()=> 'Alerts').catch(()=> null)) ||
      (await qi.describeTable('alerts').then(()=> 'alerts').catch(()=> null));
    if (!alertsTable) throw new Error('Alerts table not found');

    const usersTable =
      (await qi.describeTable('Users').then(()=> 'Users').catch(()=> null)) ||
      (await qi.describeTable('users').then(()=> 'users').catch(()=> null));
    if (!usersTable) throw new Error('Users table not found');

    const cols = await qi.describeTable(alertsTable);
    if (!cols.user_id) {
      await qi.addColumn({ tableName: alertsTable, schema: 'public' }, 'user_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: { tableName: usersTable, schema: 'public' }, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
      await qi.addIndex(alertsTable, ['user_id']);
    }
  },

  async down(qi) {
    const alertsTable =
      (await qi.describeTable('Alerts').then(()=> 'Alerts').catch(()=> null)) ||
      (await qi.describeTable('alerts').then(()=> 'alerts').catch(()=> null));
    if (!alertsTable) return;

    const cols = await qi.describeTable(alertsTable);
    if (cols.user_id) await qi.removeColumn({ tableName: alertsTable, schema: 'public' }, 'user_id');
  }
};
