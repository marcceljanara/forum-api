const AddCommentUseCase = require('../AddCommentUseCase');
const AddComment = require('../../../Domains/threads/entities/AddComment');
const AddedComment = require('../../../Domains/threads/entities/AddedComment');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('AddCommentUseCase', () => {
  it('should orchestrate the add comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      content: 'This is a comment',
    };

    const credentials = 'user-123'; // Credentials langsung berupa id

    // Mock repository
    const mockThreadRepository = {
      verifyThreadExistence: jest.fn(),
      addCommentToThread: jest.fn(),
    };

    // Mock behavior
    mockThreadRepository.verifyThreadExistence.mockResolvedValue();
    mockThreadRepository.addCommentToThread.mockResolvedValue({
      id: 'comment-123',
      content: useCasePayload.content,
      owner: credentials,
      date: '2024-11-19T06:44:56.480Z', // Tambahkan field `date`
    });

    // Use case instance
    const addCommentUseCase = new AddCommentUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedComment = await addCommentUseCase.execute(useCasePayload, credentials);

    // Assert: Verifikasi pemanggilan `verifyThreadExistence` dengan parameter benar
    expect(mockThreadRepository.verifyThreadExistence)
      .toHaveBeenCalledWith(useCasePayload.threadId);

    // Validasi payload untuk AddComment entity
    const addCommentEntity = new AddComment({ content: useCasePayload.content });
    expect(addCommentEntity.content).toEqual(useCasePayload.content);

    // Verifikasi `addCommentToThread` dipanggil dengan parameter yang benar
    expect(mockThreadRepository.addCommentToThread).toHaveBeenCalledWith(useCasePayload.threadId, {
      content: addCommentEntity.content,
      owner: credentials,
    });

    // Memastikan hasil pengembalian berupa AddedComment yang valid
    const expectedAddedComment = new AddedComment({
      id: 'comment-123',
      content: useCasePayload.content,
      owner: credentials,
      date: '2024-11-19T06:44:56.480Z', // Sesuaikan dengan mock nilai
    });
    expect(addedComment).toEqual(expectedAddedComment);
  });

  it('should throw an error if the thread does not exist', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      content: 'This is a comment',
    };

    const credentials = 'user-123'; // Credentials langsung berupa id

    // Mock repository
    const mockThreadRepository = {
      verifyThreadExistence: jest.fn(),
      addCommentToThread: jest.fn(),
    };

    // Mock behavior untuk thread yang tidak ada
    mockThreadRepository.verifyThreadExistence.mockRejectedValue(new NotFoundError('THREAD_NOT_FOUND'));

    // Use case instance
    const addCommentUseCase = new AddCommentUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action and Assert: Memastikan error dilempar jika thread tidak ada
    await expect(addCommentUseCase.execute(useCasePayload, credentials))
      .rejects
      .toThrowError(new NotFoundError('THREAD_NOT_FOUND'));

    // Verifikasi pemanggilan fungsi mock
    expect(mockThreadRepository.verifyThreadExistence)
      .toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockThreadRepository.addCommentToThread).not.toHaveBeenCalled();
  });

  it('should throw an error if credentials do not exist', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      content: 'This is a comment',
    };

    const invalidCredentials = null; // Credentials tidak ada

    // Mock repository
    const mockThreadRepository = {
      verifyThreadExistence: jest.fn(),
      addCommentToThread: jest.fn(),
    };

    // Use case instance
    const addCommentUseCase = new AddCommentUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action and Assert: Memastikan error dilempar jika credentials tidak ada
    await expect(addCommentUseCase.execute(useCasePayload, invalidCredentials))
      .rejects
      .toThrowError('ADD_COMMENT_USE_CASE.NOT_AUTHENTICATED');

    // Verifikasi bahwa repository tidak dipanggil karena kredensial tidak valid
    expect(mockThreadRepository.verifyThreadExistence).not.toHaveBeenCalled();
    expect(mockThreadRepository.addCommentToThread).not.toHaveBeenCalled();
  });
});
