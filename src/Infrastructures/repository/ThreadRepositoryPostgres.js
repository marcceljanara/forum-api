const ThreadRepository = require('../../Domains/threads/ThreadRepository');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  // Menambahkan thread baru
  async addThread(addThread, owner) {
    const { title, body } = addThread;
    const id = `thread-${this._idGenerator()}`;
    const query = {
      text: `INSERT INTO threads (id, title, body, owner, date) 
           VALUES($1, $2, $3, $4, NOW()) 
           RETURNING id, title, body, owner, date`,
      values: [id, title, body, owner],
    };

    const result = await this._pool.query(query);
    return result.rows[0];
  }

  // Verifikasi keberadaan thread
  async verifyThreadExistence(threadId) {
    const query = {
      text: 'SELECT id FROM threads WHERE id = $1',
      values: [threadId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Thread tidak ditemukan');
    }
  }

  // Mengambil detail thread berdasarkan threadId
  async getThreadById(threadId) {
    const query = {
      text: `
      SELECT 
        threads.id AS thread_id, 
        threads.title, 
        threads.body, 
        threads.date, 
        users.username
      FROM threads
      INNER JOIN users ON users.id = threads.owner
      WHERE threads.id = $1
    `,
      values: [threadId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Thread tidak ditemukan');
    }

    return result.rows[0];
  }

  // Menambahkan komentar ke thread
  async addCommentToThread(threadId, comment) {
    const { content, owner } = comment;
    const id = `comment-${this._idGenerator()}`;
    const query = {
      text: `INSERT INTO comments (id, content, thread_id, owner, date) 
           VALUES($1, $2, $3, $4, NOW()) 
           RETURNING id, content, owner, date`,
      values: [id, content, threadId, owner],
    };

    const result = await this._pool.query(query);
    return result.rows[0];
  }

  // Menghapus komentar
  async deleteComment(commentId) {
    const query = {
      text: 'UPDATE comments SET is_deleted = TRUE WHERE id = $1 RETURNING id',
      values: [commentId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Komentar tidak ditemukan');
    }
    return result.rows[0];
  }

  // Mengambil komentar dari thread
  async getCommentsByThreadId(threadId) {
    const query = {
      text: `SELECT comments.id, comments.content, comments.date, comments.is_deleted, users.username 
             FROM comments 
             JOIN users ON comments.owner = users.id 
             WHERE comments.thread_id = $1
             ORDER BY comments.date ASC`,
      values: [threadId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  // Verifikasi kepemilikan komentar
  async verifyCommentOwnership(commentId, ownerId) {
    const query = {
      text: 'SELECT id FROM comments WHERE id = $1 AND owner = $2',
      values: [commentId, ownerId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  // Verifikasi keberadaan komentar
  async verifyCommentExistence(commentId) {
    const query = {
      text: 'SELECT id FROM comments WHERE id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Komentar tidak ditemukan');
    }
  }
}

module.exports = ThreadRepositoryPostgres;
