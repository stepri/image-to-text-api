const express = require('express')
const bodyParser = require('body-parser');
const morganBody = require('morgan-body');
const morgan = require('morgan')
const Tesseract = require('tesseract.js')
const request = require('request');
const multer = require('multer')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/uploads')
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now())
  }
})

const upload = multer({ storage: storage })

const app = express()
app.use(morgan('combined'))
app.use(bodyParser.json());
morganBody(app);
const port = process.env.PORT || 3000;

const createResponse = (buffer, lang, callback) => {
  Tesseract.recognize(buffer, {
    lang: lang
  }).progress(message => {
    console.log('progress is: ', message)
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
  });
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
        return res.send(result)
      })
    })
  });

})

app.post('/recognize', upload.any(), (req, res) => {
  console.log(req.body, req.files)
  createResponse(req.files[0].path, 'eng', (result) => {
    return res.send(result)
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

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send({
    error: true
  })
})


app.listen(port, () => console.log(`image-to-text-api listening on port ${port}!`))