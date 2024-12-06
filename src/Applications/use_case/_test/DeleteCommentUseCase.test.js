const DeleteCommentUseCase = require('../DeleteCommentUseCase');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');

describe('DeleteCommentUseCase', () => {
  it('should orchestrate the delete comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
    };
    const credentials = 'user-123'; // Credentials langsung berupa ID

    const mockThreadRepository = new ThreadRepository();

    // Mock thread and comment verification
    mockThreadRepository.verifyThreadExistence = jest.fn().mockResolvedValue();
    mockThreadRepository.verifyCommentExistence = jest.fn().mockResolvedValue();
    mockThreadRepository.verifyCommentOwnership = jest.fn().mockResolvedValue();

    // Mock delete comment dengan hasil resolved Promise yang sesuai
    mockThreadRepository.deleteComment = jest
      .fn()
      .mockResolvedValue({ id: useCasePayload.commentId });

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    await deleteCommentUseCase.execute(useCasePayload, credentials);

    // Assert
    expect(mockThreadRepository.verifyThreadExistence).toHaveBeenCalledWith(
      useCasePayload.threadId,
    );
    expect(mockThreadRepository.verifyCommentExistence).toHaveBeenCalledWith(
      useCasePayload.commentId,
    );
    expect(mockThreadRepository.verifyCommentOwnership).toHaveBeenCalledWith(
      useCasePayload.commentId,
      credentials, // Menggunakan credentials langsung
    );
    expect(mockThreadRepository.deleteComment).toHaveBeenCalledWith(
      useCasePayload.commentId,
    );

    // Verifikasi tidak ada pemanggilan tambahan fungsi repository
    expect(mockThreadRepository.verifyThreadExistence).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.verifyCommentExistence).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.verifyCommentOwnership).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.deleteComment).toHaveBeenCalledTimes(1);
  });

  it('should throw error if the user is not authenticated', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
    };

    const credentials = null; // Tidak ada user ID

    const mockThreadRepository = new ThreadRepository();

    // Mock thread repository untuk menghindari eksekusi metode lainnya
    mockThreadRepository.verifyThreadExistence = jest.fn();
    mockThreadRepository.verifyCommentExistence = jest.fn();
    mockThreadRepository.verifyCommentOwnership = jest.fn();
    mockThreadRepository.deleteComment = jest.fn();

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action and Assert
    await expect(
      deleteCommentUseCase.execute(useCasePayload, credentials),
    ).rejects.toThrow('DELETE_COMMENT_USE_CASE.NOT_AUTHENTICATED');

    // Verifikasi bahwa fungsi repository tidak dipanggil karena kredensial tidak ada
    expect(mockThreadRepository.verifyThreadExistence).not.toHaveBeenCalled();
    expect(mockThreadRepository.verifyCommentExistence).not.toHaveBeenCalled();
    expect(mockThreadRepository.verifyCommentOwnership).not.toHaveBeenCalled();
    expect(mockThreadRepository.deleteComment).not.toHaveBeenCalled();
  });

  it('should throw error if the thread does not exist', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
    };
    const credentials = 'user-123';

    const mockThreadRepository = new ThreadRepository();

    // Mock thread verification untuk melempar error
    mockThreadRepository.verifyThreadExistence = jest
      .fn()
      .mockRejectedValue(new Error('THREAD_NOT_FOUND'));

    // Mock other methods
    mockThreadRepository.verifyCommentExistence = jest.fn();
    mockThreadRepository.verifyCommentOwnership = jest.fn();
    mockThreadRepository.deleteComment = jest.fn();

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action and Assert
    await expect(
      deleteCommentUseCase.execute(useCasePayload, credentials),
    ).rejects.toThrow('THREAD_NOT_FOUND');

    // Verifikasi pemanggilan fungsi
    expect(mockThreadRepository.verifyThreadExistence).toHaveBeenCalledWith(
      useCasePayload.threadId,
    );
    expect(mockThreadRepository.verifyCommentExistence).not.toHaveBeenCalled();
    expect(mockThreadRepository.verifyCommentOwnership).not.toHaveBeenCalled();
    expect(mockThreadRepository.deleteComment).not.toHaveBeenCalled();
  });
});
