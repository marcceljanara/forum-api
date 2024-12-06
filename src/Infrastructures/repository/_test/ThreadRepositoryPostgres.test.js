const pool = require('../../database/postgres/pool');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AddThread = require('../../../Domains/threads/entities/AddThread');
const AddComment = require('../../../Domains/threads/entities/AddComment');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('ThreadRepositoryPostgres', () => {
  let threadRepository;

  beforeAll(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await UsersTableTestHelper.addUser({ id: 'user-456', username: 'user456' });
    const fakeIdGenerator = () => '123'; // Stub untuk ID generator
    threadRepository = new ThreadRepositoryPostgres(pool, fakeIdGenerator);
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  describe('addThread function', () => {
    it('should return added thread correctly', async () => {
      // Arrange
      const threadPayload = new AddThread({
        title: 'Thread Title',
        body: 'Thread Body',
      });

      // Action
      const addedThread = await threadRepository.addThread(threadPayload, 'user-123');

      // Assert
      expect(addedThread.id).toBe('thread-123');
      expect(addedThread.title).toBe(threadPayload.title);
      expect(addedThread.body).toBe(threadPayload.body);
      expect(addedThread.owner).toBe('user-123');
      expect(addedThread.date).toBeDefined();
    });

    it('should persist add thread', async () => {
      // Arrange
      const threadPayload = new AddThread({
        title: 'Thread Title',
        body: 'Thread Body',
      });

      // Action
      const addedThread = await threadRepository.addThread(threadPayload, 'user-123');

      // Assert
      const thread = await ThreadsTableTestHelper.findThreadByTitle('Thread Title');
      expect(thread).toHaveLength(1);
      expect(thread[0].id).toBe(addedThread.id);
      expect(thread[0].title).toBe(threadPayload.title);
      expect(thread[0].body).toBe(threadPayload.body);
      expect(thread[0].owner).toBe(addedThread.owner);
      expect(thread[0].date).toBeDefined();
    });
  });

  describe('verifyThreadExistence function', () => {
    it('should throw NotFoundError when thread not found', async () => {
      // Action & Assert
      await expect(threadRepository.verifyThreadExistence('non-existing-thread'))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw an error when thread is found', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });

      // Action & Assert
      await expect(threadRepository.verifyThreadExistence('thread-123'))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('getThreadById function', () => {
    it('should return thread correctly', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'Thread Title',
        body: 'Thread Body',
      });

      // Action
      const thread = await threadRepository.getThreadById('thread-123');
      const threadHelper = await ThreadsTableTestHelper.findThreadById('thread-123');

      // Assert
      expect(thread).toEqual({
        thread_id: 'thread-123',
        title: 'Thread Title',
        body: 'Thread Body',
        username: 'dicoding',
        date: threadHelper[0].date,
      });
      expect(thread.date).toBeDefined();
    });

    it('should throw NotFoundError when thread not found', async () => {
      // Action & Assert
      await expect(threadRepository.getThreadById('non-existing-thread'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('addCommentToThread function', () => {
    it('should persist add comment and return added comment correctly', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-1234' });
      const addComment = new AddComment({ content: 'Comment content' });

      // Action
      const addedComment = await threadRepository.addCommentToThread('thread-1234', {
        content: addComment.content,
        owner: 'user-123',
      });

      // Assert
      const comment = await CommentsTableTestHelper.findCommentById(addedComment.id);
      expect(comment).toHaveLength(1);
      expect(comment[0]).toEqual({
        id: addedComment.id,
        content: addComment.content,
        owner: addedComment.owner,
        thread_id: 'thread-1234',
        is_deleted: false,
        date: addedComment.date,
      });
      expect(comment[0].date).toBeDefined();
    });
  });

  describe('deleteComment function', () => {
    it('should delete comment correctly', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-1235' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-12310',
        thread_id: 'thread-1235',
        owner: 'user-123',
      });

      // Action
      await threadRepository.deleteComment('comment-12310');

      // Assert
      const comment = await CommentsTableTestHelper.findCommentById('comment-12310');
      expect(comment[0].is_deleted).toEqual(true);
    });

    it('should throw NotFoundError when comment not found', async () => {
      // Action & Assert
      await expect(threadRepository.deleteComment('non-existing-comment'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('verifyCommentOwnership function', () => {
    it('should throw AuthorizationError when comment is not owned by user', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-1238' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-1238',
        thread_id: 'thread-1238',
        owner: 'user-456',
      });

      // Action & Assert
      await expect(threadRepository.verifyCommentOwnership('comment-1238', 'user-123'))
        .rejects.toThrow(AuthorizationError);
    });

    it('should not throw an error when comment is owned by user', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-1239' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-1239',
        thread_id: 'thread-1239',
        owner: 'user-123',
      });

      // Action & Assert
      await expect(threadRepository.verifyCommentOwnership('comment-1239', 'user-123'))
        .resolves.not.toThrow(AuthorizationError);
    });
  });
  describe('verifyCommentExistence function', () => {
    it('should not throw an error when comment exists', async () => {
      // Arrange: Tambahkan komentar
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-12345',
        thread_id: 'thread-123',
        owner: 'user-123',
      });

      // Action & Assert
      await expect(threadRepository.verifyCommentExistence('comment-12345')).resolves.not.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when comment does not exist', async () => {
      // Action & Assert
      await expect(threadRepository.verifyCommentExistence('non-existent-comment')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return comments correctly when they exist', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        thread_id: 'thread-123',
        content: 'A comment',
        owner: 'user-123',
        date: new Date('2024-11-21T10:00:00.000Z'),
        is_deleted: false,
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-124',
        thread_id: 'thread-123',
        content: 'Another comment',
        owner: 'user-123',
        date: new Date('2024-11-21T11:00:00.000Z'),
        is_deleted: false,
      });

      // Action
      const comments = await threadRepository.getCommentsByThreadId('thread-123');

      // Assert
      expect(comments).toHaveLength(2);
      expect(comments).toEqual([
        {
          id: 'comment-123',
          content: 'A comment',
          date: new Date('2024-11-21T10:00:00.000Z'),
          is_deleted: false,
          username: 'dicoding',
        },
        {
          id: 'comment-124',
          content: 'Another comment',
          date: new Date('2024-11-21T11:00:00.000Z'),
          is_deleted: false,
          username: 'dicoding',
        },
      ]);
    });

    it('should return an empty array when no comments exist for the thread', async () => {
      // Action
      const comments = await threadRepository.getCommentsByThreadId('thread-123');

      // Assert
      expect(comments).toHaveLength(0);
      expect(comments).toEqual([]);
    });
  });
});
