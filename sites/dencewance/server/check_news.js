import { Client, Databases } from 'node-appwrite';
const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('69d60fbe002bae1e32d5')
  .setKey('standard_7c2acfcb480f77876d630afe55d7c66136f1836f123d2825a5d0e12fee34372f3e788789845fd9a630cf4ea85b9179bd148f72d7f0c251c97d1814c1a01685a32cbcadc11ed1831d2e182eed3cee30972d3fe0168e311ad756bacb2a366dab06e5e89cf6845f1c1e1673f7664c146a2ee8cac3d91c1fecb4c0e2bf7f1e6bca4f');
const databases = new Databases(client);
const dbId = '69d60fe8000c9bd92750';
databases.listDocuments(dbId, 'news').then(res => console.log(JSON.stringify(res.documents[0], null, 2)));
