const config = require("../config");

async function main() {
  if (!config.geminiApiKey) {
    console.log("GEMINI_API_KEY belum diisi di .env");
    return;
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",
    { headers: { "x-goog-api-key": config.geminiApiKey } }
  );

  if (!response.ok) {
    console.log(`Gagal: HTTP ${response.status}`);
    console.log(await response.text());
    return;
  }

  const data = await response.json();

  const names = (data.models || [])
    .filter((model) => (model.supportedGenerationMethods || []).includes("generateContent"))
    .map((model) => model.name.replace("models/", ""));

  console.log("Model yang bisa dipakai (generateContent):");
  names.forEach((name) => console.log(` - ${name}`));

  console.log(`\nModel utama di .env   : ${config.geminiModel}`);
  console.log(`Model cadangan di .env: ${config.geminiFallbackModel || "(kosong)"}`);

  [config.geminiModel, config.geminiFallbackModel]
    .filter(Boolean)
    .forEach((model) => {
      if (!names.includes(model)) {
        console.log(
          `PERINGATAN: "${model}" tidak ada di daftar. Ganti dengan salah satu nama di atas.`
        );
      }
    });
}

main();