import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Load environment API key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is not set!');
  process.exit(1);
}

const ai = new GoogleGenerativeAI(apiKey);

function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType
    }
  };
}

async function testOCR(fileName, filePath) {
  console.log(`\n--- Testing OCR on: ${fileName} ---`);
  try {
    const imagePart = fileToGenerativePart(filePath, 'image/jpeg');
    const prompt = `
이 이미지(식료품 포장지 사진)를 보고 다음 정보를 추출해서 JSON 형식으로 응답해줘:
1. name: 제품의 브랜드와 이름 (예: '오뚜기 오리지널 핫도그', '하림 치킨너겟'). 한글로 가장 깔끔하고 대표적인 이름으로 작성해줘.
2. expirationDate: 포장지에 적혀있는 유통기한 또는 소비기한 날짜. 'YYYY-MM-DD' 형식의 문자열로 응답해줘. 날짜를 표기하는 숫자(연, 월, 일)를 모두 포함해야해.
만약 'H2026.03.15까지'와 같이 'H'나 특수문자가 날짜 앞에 있다면 제거하고 '2026-03-15'로 날짜만 추출해줘. 
만약 이미지에서 유통기한을 도저히 찾기 어렵거나 식별 불가능한 경우, 오늘 날짜(2026-06-14)를 기준으로 '3일 후' 날짜를 'YYYY-MM-DD' 형식으로 넣어줘.

반드시 아래 JSON 스키마를 준수하여 응답해줘:
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "expirationDate": { "type": "string" }
  },
  "required": ["name", "expirationDate"]
}
`;

    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            imagePart
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.response.text();
    console.log(`Parsed result for ${fileName}:`);
    console.log(responseText);
    const parsed = JSON.parse(responseText);
    console.log(`Verification: Name is "${parsed.name}", Expiration date is "${parsed.expirationDate}"`);
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
  }
}

async function runTests() {
  const artifactDir = 'C:/Users/user/.gemini/antigravity/brain/08dc6f1b-910e-4672-973e-b2ccb4bc19e5';
  const file1 = path.join(artifactDir, 'media__1781424565285.jpg');
  const file2 = path.join(artifactDir, 'media__1781424571653.jpg');

  if (fs.existsSync(file1)) {
    await testOCR('media__1781424565285.jpg (Hotdog)', file1);
  } else {
    console.error(`File not found: ${file1}`);
  }

  if (fs.existsSync(file2)) {
    await testOCR('media__1781424571653.jpg (Chicken Nuggets)', file2);
  } else {
    console.error(`File not found: ${file2}`);
  }
}

runTests();
