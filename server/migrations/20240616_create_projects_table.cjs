'use strict';

module.exports = {
  async up(qi, Sequelize) {
    const exists =
      (await qi.describeTable('Projects').then(()=> 'Projects').catch(()=> null)) ||
      (await qi.describeTable('projects').then(()=> 'projects').catch(()=> null));
    if (exists) return;

    const target = 'Projects';
    await qi.createTable(target, {
      id:            { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name:          { type: Sequelize.STRING, allowNull: false },
      client:        { type: Sequelize.STRING, allowNull: true },
      status:        { type: Sequelize.STRING, allowNull: false, defaultValue: 'active' },
      tender_value:  { type: Sequelize.DECIMAL, allowNull: true, defaultValue: 0 },
      start_date:    { type: Sequelize.DATE, allowNull: true },
      end_date:      { type: Sequelize.DATE, allowNull: true },
      manager_ids:   { type: Sequelize.ARRAY(Sequelize.INTEGER), allowNull: true, defaultValue: [] },
      file:          { type: Sequelize.STRING, allowNull: true },
      createdAt:     { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt:     { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await qi.addIndex(target, ['status']);
    await qi.addIndex(target, ['client']);
    await qi.addIndex(target, ['end_date']);
  },

  async down(qi) {
    const t =
      (await qi.describeTable('Projects').then(()=> 'Projects').catch(()=> null)) ||
      (await qi.describeTable('projects').then(()=> 'projects').catch(()=> null));
    if (t) await qi.dropTable(t);
  }
};
