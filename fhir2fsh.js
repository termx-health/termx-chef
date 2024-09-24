const router = require("express").Router()

const {gofshClient} = require('gofsh')
const {fail} = require('./utils')
const {getFhirOptionsFromHeader} = require('./header-utils')

const prepareFhirContent = req => {
    if (req.body && !Array.isArray(req.body)) {
        return [req.body];
    }
    return req.body
}

router.post("/v2/fhir2fsh", async (req, res) => {
    const options = await getFhirOptionsFromHeader(req)
    res.contentType("application/fsh")
    gofshClient
        .fhirToFsh(prepareFhirContent(req), options)
        .then((results) => {
            if (results.errors?.length > 0) {
                fail(res, results)
            } else {
                res.send(results.fsh)
            }
        })
        .catch((err) => {
            fail(res, err)
        })

})

module.exports = router