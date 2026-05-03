import { Client, Databases, ID } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('69d60fbe002bae1e32d5')
  .setKey('standard_7c2acfcb480f77876d630afe55d7c66136f1836f123d2825a5d0e12fee34372f3e788789845fd9a630cf4ea85b9179bd148f72d7f0c251c97d1814c1a01685a32cbcadc11ed1831d2e182eed3cee30972d3fe0168e311ad756bacb2a366dab06e5e89cf6845f1c1e1673f7664c146a2ee8cac3d91c1fecb4c0e2bf7f1e6bca4f');

const databases = new Databases(client);

async function run() {
  const dbId = '69d60fe8000c9bd92750';
  
  // Add views, category, tags, author_id
  try { await databases.createIntegerAttribute(dbId, 'reels', 'views', false, 0); } catch(e){}
  try { await databases.createStringAttribute(dbId, 'reels', 'category', 100, false); } catch(e){}
  try { await databases.createStringAttribute(dbId, 'reels', 'tags', 1000, false, null, true); } catch(e){}
  try { await databases.createStringAttribute(dbId, 'reels', 'author_id', 100, false); } catch(e){}
  try { await databases.createStringAttribute(dbId, 'reels', 'description', 5000, false); } catch(e){}
  try { await databases.createStringAttribute(dbId, 'reels', 'external_url', 1000, false); } catch(e){}


  try { await databases.createIntegerAttribute(dbId, 'news', 'views', false, 0); } catch(e){}
  try { await databases.createStringAttribute(dbId, 'news', 'category', 100, false); } catch(e){}
  try { await databases.createStringAttribute(dbId, 'news', 'tags', 1000, false, null, true); } catch(e){}
  try { await databases.createStringAttribute(dbId, 'news', 'author_id', 100, false); } catch(e){}
  try { await databases.createStringAttribute(dbId, 'news', 'slug', 255, false); } catch(e){}

}
run();
