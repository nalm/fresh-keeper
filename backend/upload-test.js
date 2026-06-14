import fs from 'fs';
import path from 'path';

async function uploadFiles() {
  const artifactDir = 'C:/Users/user/.gemini/antigravity/brain/08dc6f1b-910e-4672-973e-b2ccb4bc19e5';
  const file1 = path.join(artifactDir, 'media__1781424565285.jpg');
  const file2 = path.join(artifactDir, 'media__1781424571653.jpg');

  if (!fs.existsSync(file1) || !fs.existsSync(file2)) {
    console.error('Error: Source test files not found in the artifacts folder.');
    return;
  }

  console.log('Preparing to upload test images to Express backend on http://localhost:5000...');

  // Create form data using native browser-like FormData supported in Node v20+
  const formData = new FormData();
  
  const file1Buffer = fs.readFileSync(file1);
  const file2Buffer = fs.readFileSync(file2);

  formData.append('images', new Blob([file1Buffer], { type: 'image/jpeg' }), 'media__1781424565285.jpg');
  formData.append('images', new Blob([file2Buffer], { type: 'image/jpeg' }), 'media__1781424571653.jpg');

  try {
    const response = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Upload response from backend:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\nSuccess! Both files have been uploaded, analyzed via Gemini, and inserted into the DB.');
  } catch (error) {
    console.error('Error uploading files:', error);
  }
}

uploadFiles();
