const { generateQuestions } = require("../services/aiService");


async function main() {
  const topic = process.argv[2] || "Sejarah Indonesia";
  const count = Number(process.argv[3]) || 5;
  const difficulty = process.argv[4] || "Sedang";

  console.log(`Topik: "${topic}" | ${count} soal | ${difficulty}\n`);

  const startedAt = Date.now();
  const result = await generateQuestions({ topic, count, difficulty });
  console.log(`Selesai dalam ${Date.now() - startedAt} ms`);
  console.log(`Jenis hasil: ${result.type}\n`);

  if (result.type === "generated") {
    console.log(`Penyedia: ${result.provider}\n`);
    result.questions.forEach((question, index) => {
      console.log(`${index + 1}. ${question.text}`);
      question.options.forEach((option, i) => {
        const mark = i === question.answerIndex ? "  <-- benar" : "";
        console.log(`   ${i + 1}) ${option}${mark}`);
      });
      console.log(`   Penjelasan: ${question.explanation}\n`);
    });
  }

  if (result.type === "rejected") {
    console.log(`Alasan: ${result.reason}`);
    console.log(`Saran: ${result.suggestions.join(", ")}`);
  }

  if (result.type === "fallback") {
    console.log(`Memakai soal cadangan (${result.questions.length} soal)`);
    console.log("Penyebab:");
    result.errors.forEach((error) => console.log(` - ${error}`));
  }
}

main();