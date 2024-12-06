/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('comments', {
    id: {
      type: 'VARCHAR(50)', // Ensure this matches the data type of 'id' in 'threads' and 'users' tables
      primaryKey: true,
    },
    content: {
      type: 'TEXT',
      notNull: true,
    },
    thread_id: {
      type: 'VARCHAR(50)', // Ensure this matches the 'id' type of the 'threads' table
      notNull: true,
      references: '"threads"(id)',
      onDelete: 'CASCADE',
    },
    owner: {
      type: 'VARCHAR(50)', // Ensure this matches the 'id' type of the 'users' table
      notNull: true,
      references: '"users"(id)',
      onDelete: 'CASCADE',
    },
    date: {
      type: 'TIMESTAMP',
      default: pgm.func('current_timestamp'),
      notNull: true,
    },
    is_deleted: {
      type: 'BOOLEAN',
      notNull: true,
      default: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('comments');
};
