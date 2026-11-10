// Express mengenali penangan error dari jumlah parameternya (harus 4),
// jadi parameter "next" jangan dihapus walau tidak dipakai.
function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    message: status >= 500 ? "Terjadi kesalahan pada server" : err.message,
    code: err.code || (status >= 500 ? "SERVER_ERROR" : "BAD_REQUEST"),
  });
}

module.exports = errorHandler;