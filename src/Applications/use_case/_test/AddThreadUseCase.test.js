const AddThreadUseCase = require('../AddThreadUseCase');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const AddThread = require('../../../Domains/threads/entities/AddThread');

describe('AddThreadUseCase', () => {
  it('should orchestrate the add thread action correctly', async () => {
    // Arrange
    const useCasePayload = {
      title: 'A Thread Title',
      body: 'This is the body of the thread',
    };
    const credentials = 'user-123'; // Credentials berupa ID user

    const mockThreadRepository = new ThreadRepository();

    // Mocking the method
    mockThreadRepository.addThread = jest.fn().mockImplementation((addThread, owner) => {
      // Validasi argumen di dalam implementasi mock
      expect(addThread).toBeInstanceOf(AddThread); // Verifikasi argumen adalah instance AddThread
      expect(addThread.title).toEqual(useCasePayload.title);
      expect(addThread.body).toEqual(useCasePayload.body);
      expect(owner).toEqual(credentials);

      // Mengembalikan resolved Promise dengan field yang sesuai
      return Promise.resolve({
        id: 'thread-123',
        title: addThread.title,
        body: addThread.body, // Menambahkan `body` agar sesuai dengan spesifikasi
        owner,
        date: new Date().toISOString(), // Menambahkan `date` untuk memenuhi spesifikasi
      });
    });

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedThread = await addThreadUseCase.execute(useCasePayload, credentials);

    // Assert
    expect(mockThreadRepository.addThread)
      .toHaveBeenCalledTimes(1); // Memastikan fungsi dipanggil sekali
    expect(addedThread).toEqual({
      id: 'thread-123',
      title: useCasePayload.title,
      body: useCasePayload.body, // Memastikan `body` ada di hasil yang dikembalikan
      owner: credentials,
      date: expect.any(String), // Memastikan `date` adalah string
    });
  });

  it('should throw error if user is not authenticated', async () => {
    // Arrange
    const useCasePayload = {
      title: 'A Thread Title',
      body: 'This is the body of the thread',
    };
    const credentials = null; // Tidak ada credentials

    const mockThreadRepository = new ThreadRepository();

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action & Assert
    await expect(addThreadUseCase.execute(useCasePayload, credentials))
      .rejects.toThrow('ADD_THREAD_USE_CASE.NOT_AUTHENTICATED');
  });
});
