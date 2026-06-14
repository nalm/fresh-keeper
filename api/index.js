import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { supabase, useSupabase } from './supabase.js';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Set up in-memory storage for file uploads (handles both serverless & local hybrid)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenerativeAI(apiKey);

// Helper mapping function: database snake_case -> frontend camelCase
function mapDbItemToFrontend(item) {
  if (!item) return null;
  return {
    id: item.id,
    name: item.name,
    expirationDate: item.expiration_date || item.expirationDate,
    status: item.status,
    imageUrl: item.image_url || item.imageUrl,
    addedAt: item.created_at || item.addedAt
  };
}

// 1. Upload images (to Supabase Storage or local folder) and extract info using Gemini
app.post('/api/upload', upload.array('images'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }

  const results = [];
  const errors = [];

  for (const file of req.files) {
    try {
      const filename = `${uuidv4()}${path.extname(file.originalname)}`;
      let imageUrl = '';
      
      if (useSupabase) {
        // Upload to Supabase Storage Bucket 'food-images'
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('food-images')
          .upload(filename, file.buffer, {
            contentType: file.mimetype,
            upsert: true
          });

        if (uploadError) {
          throw new Error(`Supabase Storage upload error: ${uploadError.message}`);
        }

        // Get public URL of the uploaded image
        const { data: urlData } = supabase.storage
          .from('food-images')
          .getPublicUrl(filename);

        imageUrl = urlData.publicUrl;
      } else {
        // Fallback: Save to local directory (local development)
        try {
          const localUploadDir = path.join(__dirname, '..', 'frontend', 'public', 'uploads');
          if (!fs.existsSync(localUploadDir)) {
            fs.mkdirSync(localUploadDir, { recursive: true });
          }
          const localFilePath = path.join(localUploadDir, filename);
          fs.writeFileSync(localFilePath, file.buffer);
          imageUrl = `/uploads/${filename}`;
        } catch (localWriteError) {
          console.warn('Failed writing to local public/uploads. Using base64 Data URL fallback.', localWriteError);
          // If local disk writing fails (e.g. on serverless Vercel), use base64 data URL
          imageUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        }
      }

      // Convert buffer to base64 for Gemini
      const imagePart = {
        inlineData: {
          data: file.buffer.toString('base64'),
          mimeType: file.mimetype
        }
      };

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
      console.log(`Gemini response for ${file.originalname}:`, responseText);
      
      const parsedData = JSON.parse(responseText);

      // Validate date format, if invalid fallback to 3 days from now (2026-06-14)
      let finalDate = parsedData.expirationDate;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(finalDate)) {
        const fallback = new Date('2026-06-14');
        fallback.setDate(fallback.getDate() + 3);
        finalDate = fallback.toISOString().split('T')[0];
      }

      const extractedItem = {
        name: parsedData.name || '알 수 없는 상품',
        expirationDate: finalDate,
        imageUrl: imageUrl
      };

      results.push(extractedItem);
    } catch (error) {
      console.error(`Error processing file ${file.originalname}:`, error);
      errors.push({ filename: file.originalname, error: error.message });
    }
  }

  res.json({ success: true, extractedItems: results, errors });
});

// 2. Get all inventory items
app.get('/api/inventory', async (req, res) => {
  try {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('expiration_date', { ascending: true });

      if (error) throw error;
      res.json(data.map(mapDbItemToFrontend));
    } else {
      // Local JSON DB fallback
      res.json(db.getItems().map(mapDbItemToFrontend));
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Add manual item (supports both single object and array of objects for bulk insert)
app.post('/api/inventory', async (req, res) => {
  try {
    const body = req.body;
    const itemsToAdd = Array.isArray(body) ? body : [body];
    
    // Validate all items
    for (const item of itemsToAdd) {
      if (!item.name || !item.expirationDate) {
        return res.status(400).json({ error: 'Name and expirationDate are required for all items.' });
      }
    }

    const addedResults = [];

    if (useSupabase) {
      const dbRows = itemsToAdd.map(item => ({
        name: item.name,
        expiration_date: item.expirationDate,
        status: item.status || 'active',
        image_url: item.imageUrl || null
      }));

      const { data, error } = await supabase
        .from('inventory')
        .insert(dbRows)
        .select();

      if (error) throw error;
      addedResults.push(...data.map(mapDbItemToFrontend));
    } else {
      // Local JSON DB fallback
      for (const item of itemsToAdd) {
        const added = db.addItem({
          id: uuidv4(),
          name: item.name,
          expirationDate: item.expirationDate,
          status: item.status || 'active',
          imageUrl: item.imageUrl || null
        });
        addedResults.push(mapDbItemToFrontend(added));
      }
    }
    
    res.status(201).json(Array.isArray(body) ? addedResults : addedResults[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Update item status (active -> consumed)
app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, name, expirationDate } = req.body;
    
    let updatedItem;

    if (useSupabase) {
      const updates = {};
      if (status) updates.status = status;
      if (name) updates.name = name;
      if (expirationDate) updates.expiration_date = expirationDate;
      
      const { data, error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Item not found.' });
      }
      updatedItem = mapDbItemToFrontend(data[0]);
    } else {
      // Local JSON DB fallback
      const updates = {};
      if (status) updates.status = status;
      if (name) updates.name = name;
      if (expirationDate) updates.expirationDate = expirationDate;

      const updated = db.updateItem(id, updates);
      if (!updated) {
        return res.status(404).json({ error: 'Item not found.' });
      }
      updatedItem = mapDbItemToFrontend(updated);
    }
    
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Delete item
app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let deletedItem;

    if (useSupabase) {
      const { data, error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Item not found.' });
      }
      deletedItem = mapDbItemToFrontend(data[0]);
    } else {
      // Local JSON DB fallback
      const deleted = db.deleteItem(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Item not found.' });
      }
      deletedItem = mapDbItemToFrontend(deleted);
    }
    
    res.json({ success: true, deleted: deletedItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Recipe recommendation
app.post('/api/recipes', async (req, res) => {
  try {
    const { ingredients } = req.body;
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'At least one ingredient is required.' });
    }

    const prompt = `
내 냉장고에 다음과 같은 남은 재료들이 있어: ${ingredients.join(', ')}
이 재료들을 주재료로 하고, 일반적인 가정집에 있을 만한 조미료나 부재료를 최소한으로 추가해서 만들 수 있는 맛있는 요리 3가지를 추천해줘.
각 요리마다 다음 정보가 필요해:
1. title: 요리 이름 (예: '치킨너겟 볶음밥')
2. description: 요리에 대한 간단하고 침샘을 자극하는 한 줄 설명
3. ingredients: 상세 필요 식재료 목록 (냉장고 속 재료와 추가 필요한 조미료 등을 분리 기재하거나 포함)
4. instructions: 단계별 조리 순서 목록 (각 단계는 자세히 작성해줘)
5. difficulty: 난이도 ('쉬움', '보통', '어려움' 중 하나)
6. time: 예상 소요 시간 (예: '15분', '30분')

반드시 아래 JSON 스키마를 만족하는 JSON 배열 형식으로만 응답해줘. 다른 텍스트나 \`\`\`json 마크다운 코드는 포함하지 말아줘.
[
  {
    "title": "string",
    "description": "string",
    "ingredients": ["string"],
    "instructions": ["string"],
    "difficulty": "string",
    "time": "string"
  }
]
`;

    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.response.text();
    console.log('Gemini recipe response:', responseText);

    const recipes = JSON.parse(responseText);
    res.json(recipes);
  } catch (error) {
    console.error('Error generating recipes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export app for Vercel Serverless Functions
export default app;
