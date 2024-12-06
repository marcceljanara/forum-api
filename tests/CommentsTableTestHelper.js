/* istanbul ignore file */
/* eslint-disable camelcase */
const pool = require('../src/Infrastructures/database/postgres/pool');

const CommentsTableTestHelper = {
  async addComment({
    id = 'comment-123', content = 'Comment content', thread_id = 'thread-123', owner = 'user-123', date = '2024-11-21T10:00:00.000Z',
  }) {
    const query = {
      text: 'INSERT INTO comments (id, content, thread_id, owner, date) VALUES($1, $2, $3, $4, $5)',
      values: [id, content, thread_id, owner, date],
    };
    await pool.query(query);
  },

  async findCommentById(id) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1',
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM comments WHERE 1=1');
  },
};

module.exports = CommentsTableTestHelper;
