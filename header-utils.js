const CONTENT_TYPE_HEADER = "Content-Type"

const hthvParseSemiSepPromise = (async function () {
    const {hthvParseSemiSep} = await import('http-header-value')
    return hthvParseSemiSep
})()

async function hthvParseSemiSep(header) {
    return (await hthvParseSemiSepPromise)(header)

}

async function getFshOptionsFromHeader(req) {
    const contentType = req.get(CONTENT_TYPE_HEADER)
    const options = contentType.replace(/application\/fsh;?/, '')
    return (await hthvParseSemiSep(options))
        .reduce((map, {n, v}) => ({...map, [n]: v}), {})
}

async function getFhirOptionsFromHeader(req) {
    const contentType = req.get(CONTENT_TYPE_HEADER)
    const options = contentType.replace(/application\/fhir\+json;?/, '')
    return (await hthvParseSemiSep(options))
        .reduce((map, {n, v}) => ({...map, [n]: v}), {})
}

module.exports = {getFshOptionsFromHeader, getFhirOptionsFromHeader}