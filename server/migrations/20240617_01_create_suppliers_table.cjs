'use strict';

module.exports = {
  async up(qi, Sequelize) {
    const exists =
      (await qi.describeTable('Suppliers').then(()=> 'Suppliers').catch(()=> null)) ||
      (await qi.describeTable('suppliers').then(()=> 'suppliers').catch(()=> null));
    if (exists) return;

    const target = 'Suppliers';
    await qi.createTable(target, {
      id:            { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name:          { type: Sequelize.STRING, allowNull: false },
      company:       { type: Sequelize.STRING, allowNull: true },   // filled by later migration if absent
      contact_name:  { type: Sequelize.STRING, allowNull: true },   // filled by later migration if absent
      email:         { type: Sequelize.STRING, allowNull: true },
      phone:         { type: Sequelize.STRING, allowNull: true },
      address:       { type: Sequelize.STRING, allowNull: true },
      createdAt:     { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt:     { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await qi.addIndex(target, ['name']);
    await qi.addIndex(target, ['company']);
  },

  async down(qi) {
    const t =
      (await qi.describeTable('Suppliers').then(()=> 'Suppliers').catch(()=> null)) ||
      (await qi.describeTable('suppliers').then(()=> 'suppliers').catch(()=> null));
    if (t) await qi.dropTable(t);
  }
};
