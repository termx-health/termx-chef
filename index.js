const express = require("express");
var cors = require('cors')

const { fail } = require('./utils')
const fsh2fhirRouter = require('./fsh2fhir')
const fhir2fshRouter = require('./fhir2fsh')

const app = express();
app.use(express.json({ type: ['application/json', 'application/fhir+json'], limit: '1000mb'}));
app.use(express.text({ type: ['application/fsh'], limit: '1000mb'}));
const port = 3000;

app.use(cors())
app.use(fsh2fhirRouter)
app.use(fhir2fshRouter)

const {sushiClient} = require('fsh-sushi');
const {gofshClient} = require('gofsh');

app.listen(port, () => {
  console.log(`Running on http://localhost:${port}/`);
});

app.post("/fsh2fhir", (req, res) => {
  res.contentType("application/json")
  sushiClient
    .fshToFhir(req.body.fsh, req.body.options)
    .then((results) => {
      if (results.errors?.length > 0) {
        fail(res, results)
      } else {
        res.send(results)
      }
    })
    .catch((err) => {
      fail(res, err);
    });
});

app.post("/fhir2fsh", (req, res) => {
  res.contentType("application/json")
  const params = req.body
  gofshClient
    .fhirToFsh(params.fhir, params.options)
    .then((results) => {
      if (results.errors?.length > 0) {
        fail(res, results)
      } else {
        res.send(results)
      }
    })
    .catch((err) => {
      fail(res, err);
    });

});

