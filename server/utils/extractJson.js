// Mengambil objek JSON dari teks balasan AI.
// Menangani balasan yang dibungkus ```json ... ``` atau diberi kalimat pengantar.
// Hasilnya objek, atau null kalau tidak ada JSON yang valid.
function extractJson(text) {
  if (typeof text !== "string") return null;

  const cleaned = text.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end <= start) return null;

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (error) {
    return null;
  }
}

module.exports = { extractJson };