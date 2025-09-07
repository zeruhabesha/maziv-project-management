'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (qi, Sequelize) {
    // If already created under either casing, no-op
    const exists =
      (await qi.describeTable('Users').then(()=> 'Users').catch(()=> null)) ||
      (await qi.describeTable('users').then(()=> 'users').catch(()=> null));
    if (exists) return;

    const target = 'Users'; // Keep CamelCase to align with other tables
    await qi.createTable(target, {
      id:          { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name:        { type: Sequelize.STRING, allowNull: false },
      email:       { type: Sequelize.STRING, allowNull: false, unique: true },
      password:    { type: Sequelize.STRING, allowNull: false },
      role:        { type: Sequelize.STRING, allowNull: false, defaultValue: 'user' }, // ‘add_role’ migration will idempotently skip if exists
      createdAt:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await qi.addIndex(target, ['email'], { unique: true, name: 'users_email_unique' });
    await qi.addIndex(target, ['role'], { name: 'users_role_idx' });
  },

  async down (qi) {
    const t =
      (await qi.describeTable('Users').then(()=> 'Users').catch(()=> null)) ||
      (await qi.describeTable('users').then(()=> 'users').catch(()=> null));
    if (t) await qi.dropTable(t);
  }
};
