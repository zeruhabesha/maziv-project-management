'use strict';

module.exports = {
  async up(qi, Sequelize) {
    const exists =
      (await qi.describeTable('Phases').then(()=> 'Phases').catch(()=> null)) ||
      (await qi.describeTable('phases').then(()=> 'phases').catch(()=> null));
    if (exists) return;

    const target = 'Phases';
    await qi.createTable(target, {
      id:             { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name:           { type: Sequelize.STRING, allowNull: false },
      sequence_order: { type: Sequelize.INTEGER, allowNull: true }, // later migration can set/default it
      createdAt:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await qi.addIndex(target, ['sequence_order']);
  },

  async down(qi) {
    const t =
      (await qi.describeTable('Phases').then(()=> 'Phases').catch(()=> null)) ||
      (await qi.describeTable('phases').then(()=> 'phases').catch(()=> null));
    if (t) await qi.dropTable(t);
  }
};
