const express = require('express')
const Tesseract = require('tesseract.js')
const request = require('request');
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const app = express()

const port = process.env.PORT || 3000;

const createResponse = (buffer, lang, callback) => {
  Tesseract.recognize(buffer, {
    lang: lang
  }).then((result) => {
    return callback({
      error: false,
      text: result.text,
    })
  }).catch(err => {
    console.log(err)
    return callback({
      error: true,
      text: 'error',
    })
  })
}

app.get('/recognize', (req, res) => {
  const url = req.query.url;
  const langauge = req.query.lang || 'eng';
  if (!url) {
    return res.send({
      error: 'URL parameter missing'
    })
  }

  request.head(url, (err, response, body) => {
    console.log('content-type:', response.headers['content-type']);
    console.log('content-length:', response.headers['content-length']);

    request.get({
      url: url,
      encoding: null
     }, (err, response, body) => {
      createResponse(body, langauge, (result) => {
        return res.send(result.text.replace(/(?:\r\n|\r|\n)/g, '<br>'))
      })
    })
  });

})

app.post('/recognize', upload.single('image'), (req, res) => {
  createResponse(req.file.buffer, 'en', (result) => {
    return res.send(result.text.replace(/(?:\r\n|\r|\n)/g, '<br>'))
  })
})

app.get('/', (req, res) => {
  res.send(`
  <form action="/recognize" method="post" enctype="multipart/form-data">
  Select image to upload:
  <input type="file" name="image" id="image">
  <input type="submit" value="Upload Image" name="submit">
</form>
  `)
})

app.listen(port, () => console.log(`image-to-text-api listening on port ${port}!`))