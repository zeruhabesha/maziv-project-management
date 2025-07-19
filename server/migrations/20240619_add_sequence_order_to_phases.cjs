'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('phases', 'sequence_order', {
      type: Sequelize.INTEGER,
      allowNull: true // or false if you want it required
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('phases', 'sequence_order');
  }
};
