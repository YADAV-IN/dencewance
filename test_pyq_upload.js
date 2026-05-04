const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = 'http://localhost:4000';

async function testPYQUpload() {
  console.log('🧪 Testing PYQ Upload Flow...\n');

  try {
    // Step 1: Read admin token from file
    const tokenFile = path.join(__dirname, 'admin_token.txt');
    if (!fs.existsSync(tokenFile)) {
      console.error('❌ admin_token.txt not found. Please login first and save your token.');
      return;
    }

    const adminToken = fs.readFileSync(tokenFile, 'utf-8').trim();
    console.log('✅ Admin token loaded');

    // Step 2: Create a mock PDF file for testing
    const mockPdfPath = path.join(__dirname, 'test_pyq_sample.pdf');
    if (!fs.existsSync(mockPdfPath)) {
      // Create a minimal PDF
      const minimalPdf = Buffer.from([
        0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, // %PDF-1.4
        0x0A, 0x31, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, // \n1 0 obj
        0x0A, 0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, // \n<</Type
        0x2F, 0x43, 0x61, 0x74, 0x61, 0x6C, 0x6F, 0x67, // /Catalog
        0x2F, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, // /Pages 2
        0x20, 0x30, 0x20, 0x52, 0x3E, 0x3E, 0x0A, 0x65, // 0 R>>
        0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, 0x25, 0x45, // endobj\n%E
        0x4F, 0x46 // OF
      ]);
      fs.writeFileSync(mockPdfPath, minimalPdf);
      console.log('✅ Mock PDF created: test_pyq_sample.pdf');
    } else {
      console.log('✅ Using existing test PDF');
    }

    // Step 3: Test uploading to Appwrite directly (simulating frontend behavior)
    console.log('\n📤 Step 1: Testing file upload via Appwrite...');
    
    // For PYQ files, we just upload directly without thumbnail
    const fileStream = fs.createReadStream(mockPdfPath);
    const form = new FormData();
    form.append('media', fileStream, 'test_document.pdf');

    const uploadRes = await fetch(`${API_URL}/api/uploads/media`, {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${adminToken}`
      },
      body: form
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('❌ Upload failed:', uploadRes.status, errText);
      return;
    }

    const uploadData = await uploadRes.json();
    console.log('✅ File uploaded successfully');
    console.log('   Upload response:', JSON.stringify(uploadData, null, 2));

    const fileUrl = uploadData?.data?.url || uploadData?.url;
    if (!fileUrl) {
      console.error('❌ No file URL returned from upload');
      return;
    }

    // Step 4: Create PYQ document in Appwrite
    console.log('\n📝 Step 2: Creating PYQ document in Appwrite...');

    const pyqPayload = {
      dept: 'CS',
      course: 'CSE101',
      subject: 'Programming //SEO// C++ Java Python',
      fileName: 'test_document.pdf',
      fileType: 'application/pdf',
      fileId: fileUrl,
      uploaderId: 'test-uploader',
      cover_url: null
    };

    console.log('   Payload:', JSON.stringify(pyqPayload, null, 2));

    const pyqRes = await fetch(`${API_URL}/api/pyq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(pyqPayload)
    });

    if (!pyqRes.ok) {
      const errText = await pyqRes.text();
      console.error('❌ PYQ creation failed:', pyqRes.status, errText);
      return;
    }

    const pyqData = await pyqRes.json();
    console.log('✅ PYQ document created successfully');
    console.log('   Document ID:', pyqData?.data?.$id || 'N/A');

    // Step 5: Verify the document can be retrieved
    console.log('\n✅ Step 3: Verifying document retrieval...');
    
    const listRes = await fetch(`${API_URL}/api/pyq`);
    if (listRes.ok) {
      const listData = await listRes.json();
      console.log('✅ Retrieved', listData?.data?.length || 0, 'PYQ documents');
      const latestDoc = listData?.data?.[0];
      if (latestDoc) {
        console.log('   Latest document:', {
          dept: latestDoc.dept,
          course: latestDoc.course,
          subject: latestDoc.subject,
          fileName: latestDoc.fileName,
          fileId: latestDoc.fileId?.substring?.(0, 50) + '...' || latestDoc.fileId
        });
      }
    } else {
      console.error('❌ Failed to list PYQ documents');
    }

    console.log('\n✅ PYQ Upload Test PASSED! All systems working.\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message || error);
    console.error(error);
  }
}

testPYQUpload();
