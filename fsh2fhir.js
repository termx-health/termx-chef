const router = require("express").Router()

const {sushiClient} = require('fsh-sushi')

const {getFshOptionsFromHeader} = require('./header-utils')
const { fail } = require('./utils')

router.post("/v2/fsh2fhir", async (req, res) => {
    const options = await getFshOptionsFromHeader(req)
    res.contentType("application/json")
    sushiClient
        .fshToFhir(req.body, options)
        .then((results) => {
            if (results.errors?.length > 0) {
                fail(res, results)
            } else {
                res.send(results)
            }
        })
        .catch((err) => {
            fail(res, err)
        })
})

module.exports = router