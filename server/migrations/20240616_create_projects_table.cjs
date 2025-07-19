'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('projects', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ref_no: {
        type: Sequelize.STRING,
        unique: true
      },
      start_date: {
        type: Sequelize.DATE
      },
      end_date: {
        type: Sequelize.DATE
      },
      client: {
        type: Sequelize.STRING
      },
      manager_ids: {
        type: Sequelize.ARRAY(Sequelize.INTEGER)
      },
      description: {
        type: Sequelize.TEXT
      },
      tender_value: {
        type: Sequelize.DECIMAL(15, 2)
      },
      status: {
        type: Sequelize.ENUM('planning', 'active', 'completed', 'on_hold', 'cancelled'),
        defaultValue: 'planning'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('projects');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_projects_status";');
  }
}; 