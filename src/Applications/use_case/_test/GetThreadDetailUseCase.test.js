const GetThreadDetailUseCase = require('../GetThreadDetailUseCase');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');

describe('GetThreadDetailUseCase', () => {
  it('should orchestrate the get thread detail action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';
    const mockThreadDetail = {
      thread_id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };

    const mockComments = [
      {
        id: 'comment-1',
        username: 'johndoe',
        date: '2021-08-08T07:22:33.555Z',
        content: 'sebuah comment',
        is_deleted: false,
      },
      {
        id: 'comment-2',
        username: 'dicoding',
        date: '2021-08-08T07:26:21.338Z',
        content: 'sebuah comment deleted',
        is_deleted: true,
      },
    ];

    const mockThreadRepository = new ThreadRepository();

    // Mock methods
    mockThreadRepository.verifyThreadExistence = jest.fn().mockResolvedValue();
    mockThreadRepository.getThreadById = jest.fn().mockResolvedValue(mockThreadDetail);
    mockThreadRepository.getCommentsByThreadId = jest.fn().mockResolvedValue(mockComments);

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const threadDetail = await getThreadDetailUseCase.execute(threadId);

    // Assert
    expect(mockThreadRepository.verifyThreadExistence).toHaveBeenCalledWith(threadId);
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
    expect(mockThreadRepository.getCommentsByThreadId).toHaveBeenCalledWith(threadId);

    // Ensure each function is called only once
    expect(mockThreadRepository.verifyThreadExistence).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.getCommentsByThreadId).toHaveBeenCalledTimes(1);

    // Verify the returned thread detail
    expect(threadDetail).toEqual({
      thread: {
        id: mockThreadDetail.thread_id,
        title: mockThreadDetail.title,
        body: mockThreadDetail.body,
        date: mockThreadDetail.date,
        username: mockThreadDetail.username,
        comments: [
          {
            id: 'comment-1',
            username: 'johndoe',
            date: '2021-08-08T07:22:33.555Z',
            content: 'sebuah comment',
          },
          {
            id: 'comment-2',
            username: 'dicoding',
            date: '2021-08-08T07:26:21.338Z',
            content: '**komentar telah dihapus**',
          },
        ],
      },
    });
  });

  it('should throw error if thread does not exist', async () => {
    // Arrange
    const threadId = 'thread-123';
    const mockThreadRepository = new ThreadRepository();

    // Mock methods
    mockThreadRepository.verifyThreadExistence = jest.fn()
      .mockRejectedValue(new Error('THREAD_NOT_FOUND'));
    mockThreadRepository.getThreadById = jest.fn();
    mockThreadRepository.getCommentsByThreadId = jest.fn();

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action and Assert
    await expect(getThreadDetailUseCase.execute(threadId))
      .rejects.toThrow('THREAD_NOT_FOUND');

    // Verify method calls
    expect(mockThreadRepository.verifyThreadExistence).toHaveBeenCalledWith(threadId);
    expect(mockThreadRepository.verifyThreadExistence).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.getThreadById).not.toHaveBeenCalled();
    expect(mockThreadRepository.getCommentsByThreadId).not.toHaveBeenCalled();
  });
});
