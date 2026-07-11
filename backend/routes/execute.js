import express from "express";
import axios from "axios";

const router = express.Router();

const JUDGE0_LANGUAGE_IDS = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  csharp: 51,
  php: 68,
};

router.post("/", async (req, res) => {
  const { language, sourceCode } = req.body;
  const languageId = JUDGE0_LANGUAGE_IDS[language];

  if (!languageId) {
    return res.status(400).json({ message: `Unsupported language: ${language}` });
  }

  try {
    const response = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        source_code: sourceCode,
        language_id: languageId,
      },
      {
        headers: {
          "content-type": "application/json",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      },
    );

    res.json(response.data);
  } catch (error) {
    console.error(error?.response?.data || error.message);

    res.status(500).json({
      message: "Failed to execute code",
    });
  }
});

export default router;
