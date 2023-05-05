const url = 'https://sm.ms/api/v2/upload';
const headers = {
  "Authorization": "3vthgMwbUIznujB0u4zinDCECbxBHZsf"
};
const file = await readFile('C:\\Users\\chenyifei\\Pictures\\13.jpg');
const blob = new Blob([file], {type: 'image/jpeg'});
const fromData = new FormData();
fromData.append('smfile', blob, '13.jpg');
const response = await fetch(url, {
  method: 'POST',
  headers: headers,
  body: fromData
});
