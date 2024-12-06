// GetThreadDetailUseCase.js
class GetThreadDetailUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute(threadId) {
    // Verifikasi keberadaan thread
    await this._threadRepository.verifyThreadExistence(threadId);

    // Ambil data thread
    const threadDetail = await this._threadRepository.getThreadById(threadId);

    // Ambil komentar terkait dengan thread
    const comments = await this._threadRepository.getCommentsByThreadId(threadId);

    // Map komentar untuk mengganti konten yang dihapus
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      username: comment.username,
      date: comment.date,
      content: comment.is_deleted ? '**komentar telah dihapus**' : comment.content,
    }));

    // Gabungkan data thread dengan komentar yang diformat
    return {
      thread: {
        id: threadDetail.thread_id,
        title: threadDetail.title,
        body: threadDetail.body,
        date: threadDetail.date,
        username: threadDetail.username,
        comments: formattedComments,
      },
    };
  }
}

module.exports = GetThreadDetailUseCase;
