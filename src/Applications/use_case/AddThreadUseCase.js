const AddThread = require('../../Domains/threads/entities/AddThread');

class AddThreadUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload, credentials) {
    if (!credentials) {
      throw new Error('ADD_THREAD_USE_CASE.NOT_AUTHENTICATED');
    }

    // Membuat instance AddThread dengan menambahkan owner (credentials)
    const addThread = new AddThread(useCasePayload);

    // Menambahkan thread baru ke dalam repositori
    const addedThread = await this._threadRepository.addThread(addThread, credentials);

    return addedThread;
  }
}

module.exports = AddThreadUseCase;
