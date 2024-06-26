"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lookUpLatestPatchVersion = exports.lookUpLatestVersion = exports.loadFromPath = exports.merge = exports.cleanCachedPackage = exports.mergeDependency = exports.loadDependency = exports.loadDependencies = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const semver_1 = require("semver");
const tar_1 = __importDefault(require("tar"));
const temp_1 = __importDefault(require("temp"));
const errors_1 = require("./errors");
const FHIRDefinitions_1 = require("./FHIRDefinitions");
const axiosUtils_1 = require("./utils/axiosUtils");
const customRegistry_1 = require("./utils/customRegistry");
const LatestVersionUnavailableError_1 = require("./errors/LatestVersionUnavailableError");
class PackageCache {
    static isCurrentPackageRefreshNeeded() {
        return (!PackageCache.lastCurrentUpdate ||
            PackageCache.lastCurrentUpdate.getTime() - new Date().getTime() > 86400000);
    }
    static markCurrentPackageRefreshed() {
        this.lastCurrentUpdate = new Date();
    }
    static contains(pkg) {
        return !!this.cache[pkg];
    }
    static get(pkg) {
        return this.cache[pkg];
    }
    static put(pkg, loadedPackage) {
        this.cache[pkg] = loadedPackage;
    }
}
PackageCache.cache = {};
class LoadedPackage {
    constructor() {
        this.defs = [];
    }
}
function getDistUrl(registry, packageName, version) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const cleanedRegistry = registry.replace(/\/$/, '');
        // 1 get the manifest information about the package from the registry
        const res = yield (0, axiosUtils_1.axiosGet)(`${cleanedRegistry}/${packageName}`);
        // 2 find the NPM tarball location
        const npmLocation = (_d = (_c = (_b = (_a = res.data) === null || _a === void 0 ? void 0 : _a.versions) === null || _b === void 0 ? void 0 : _b[version]) === null || _c === void 0 ? void 0 : _c.dist) === null || _d === void 0 ? void 0 : _d.tarball;
        // 3 if found, use it, otherwise fallback to the FHIR spec location
        if (npmLocation) {
            return npmLocation;
        }
        else {
            return `${cleanedRegistry}/${packageName}/${version}`;
        }
    });
}
/**
 * Loads multiple dependencies from a directory (the user FHIR cache or a specified directory) or from online
 * @param {string[]} fhirPackages - An array of FHIR packages to download and load definitions from (format: packageId#version)
 * @param {string} [cachePath=path.join(os.homedir(), '.fhir', 'packages')] - Path to look for the package and download to if not already present. Defaults to local FHIR cache.
 * @param {LogFunction} [log=() => {}] - A function for logging. Defaults to no-op.
 * @returns {Promise<FHIRDefinitions>} the loaded FHIRDefinitions
 */
function loadDependencies(fhirPackages, cachePath = path_1.default.join(os_1.default.homedir(), '.fhir', 'packages'), log = () => { }) {
    return __awaiter(this, void 0, void 0, function* () {
        const promises = fhirPackages.map(fhirPackage => {
            const [fhirPackageId, fhirPackageVersion] = fhirPackage.split('#');
            const fhirDefs = new FHIRDefinitions_1.FHIRDefinitions();
            // Testing Hack: Use exports.mergeDependency instead of mergeDependency so that this function
            // calls the mocked mergeDependency in unit tests.  In normal (non-test) use, this should
            // have no negative effects.
            return exports
                .mergeDependency(fhirPackageId, fhirPackageVersion, fhirDefs, cachePath, log)
                .catch((e) => {
                let message = `Failed to load ${fhirPackageId}#${fhirPackageVersion}: ${e.message}`;
                if (/certificate/.test(e.message)) {
                    message +=
                        '\n\nSometimes this error occurs in corporate or educational environments that use proxies and/or SSL ' +
                            'inspection.\nTroubleshooting tips:\n' +
                            '  1. If a non-proxied network is available, consider connecting to that network instead.\n' +
                            '  2. Set NODE_EXTRA_CA_CERTS as described at https://bit.ly/3ghJqJZ (RECOMMENDED).\n' +
                            '  3. Disable certificate validation as described at https://bit.ly/3syjzm7 (NOT RECOMMENDED).\n';
                }
                log('error', message);
                fhirDefs.unsuccessfulPackageLoad = true;
                fhirDefs.package = `${fhirPackageId}#${fhirPackageVersion}`;
                return fhirDefs;
            });
        });
        return yield Promise.all(promises).then(fhirDefs => {
            if (fhirDefs.length > 1) {
                const mainFHIRDefs = new FHIRDefinitions_1.FHIRDefinitions();
                fhirDefs.forEach(d => mainFHIRDefs.childFHIRDefs.push(d));
                return mainFHIRDefs;
            }
            return fhirDefs[0];
        });
    });
}
exports.loadDependencies = loadDependencies;
/**
 * Downloads a dependency from a directory (the user FHIR cache or a specified directory) or from online.
 * The definitions from the package are added to their own FHIRDefinitions instance, which is then added to
 * the provided FHIRDefs childDefs. If the provided FHIRDefs does not yet have any children, a wrapper FHIRDefinitions
 * instance is created and both the original packages and the new package are added to childDefs.
 * @param {string} packageName - The name of the package to load
 * @param {string} version - The version of the package to load
 * @param {FHIRDefinitions} FHIRDefs - The FHIRDefinitions to load the dependencies into
 * @param {string} [cachePath=path.join(os.homedir(), '.fhir', 'packages')] - The path to load the package into (default: user FHIR cache)
 * @returns {Promise<FHIRDefinitions>} the loaded FHIRDefs
 * @throws {PackageLoadError} when the desired package can't be loaded
 */
function loadDependency(packageName, version, FHIRDefs, cachePath = path_1.default.join(os_1.default.homedir(), '.fhir', 'packages'), log = () => { }) {
    return __awaiter(this, void 0, void 0, function* () {
        const newFHIRDefs = new FHIRDefinitions_1.FHIRDefinitions();
        // Testing Hack: Use exports.mergeDependency instead of mergeDependency so that this function
        // calls the mocked mergeDependency in unit tests.  In normal (non-test) use, this should
        // have no negative effects.
        yield exports.mergeDependency(packageName, version, newFHIRDefs, cachePath, log);
        if (FHIRDefs.childFHIRDefs.length === 0) {
            const wrapperFHIRDefs = new FHIRDefinitions_1.FHIRDefinitions();
            wrapperFHIRDefs.childFHIRDefs.push(FHIRDefs, newFHIRDefs);
            return wrapperFHIRDefs;
        }
        FHIRDefs.childFHIRDefs.push(newFHIRDefs);
        return FHIRDefs;
    });
}
exports.loadDependency = loadDependency;
/**
 * Downloads a dependency from a directory (the user FHIR cache or a specified directory) or from online
 * and then loads it into the FHIRDefinitions class provided
 * Note: You likely want to use loadDependency, which adds the package to its own FHIRDefinitions class instance
 * before appending that package to the provided FHIRDefinitions.childDefs array. This maintains the same structure
 * that is created with loadDependencies.
 * @param {string} packageName - The name of the package to load
 * @param {string} version - The version of the package to load
 * @param {FHIRDefinitions} FHIRDefs - The FHIRDefinitions to load the dependencies into
 * @param {string} [cachePath=path.join(os.homedir(), '.fhir', 'packages')] - The path to load the package into (default: user FHIR cache)
 * @returns {Promise<FHIRDefinitions>} the loaded FHIRDefs
 * @throws {PackageLoadError} when the desired package can't be loaded
 */
function mergeDependency(packageName, version, FHIRDefs, cachePath = path_1.default.join(os_1.default.homedir(), '.fhir', 'packages'), log = () => { }) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        if (version === 'latest') {
            // using the exported function here to allow for easier mocking in tests
            version = yield exports.lookUpLatestVersion(packageName, log);
        }
        else if (/^\d+\.\d+\.x$/.test(version)) {
            // using the exported function here to allow for easier mocking in tests
            version = yield exports.lookUpLatestPatchVersion(packageName, version, log);
        }
        else if (/^\d+\.x$/.test(version)) {
            throw new errors_1.IncorrectWildcardVersionFormatError(packageName, version);
        }
        let fullPackageName = `${packageName}#${version}`;
        const loadPath = path_1.default.join(cachePath, fullPackageName, 'package');
        let loadedPackage;
        // First, try to load the package from the local cache
        log('info', `Checking ${cachePath} for ${fullPackageName}...`);
        loadedPackage = loadFromPath(cachePath, fullPackageName);
        if (loadedPackage) {
            log('info', `Found ${fullPackageName} in ${cachePath}.`);
        }
        else {
            log('info', `Did not find ${fullPackageName} in ${cachePath}.`);
        }
        // When a dev package is not present locally, fall back to using the current version
        // as described here https://confluence.hl7.org/pages/viewpage.action?pageId=35718627#IGPublisherDocumentation-DependencyList
        if (version === 'dev' && !loadedPackage) {
            log('info', `Falling back to ${packageName}#current since ${fullPackageName} is not locally cached. To avoid this, add ${fullPackageName} to your local FHIR cache by building it locally with the HL7 FHIR IG Publisher.`);
            version = 'current';
            fullPackageName = `${packageName}#${version}`;
            loadedPackage = loadFromPath(cachePath, fullPackageName);
        }
        let packageUrl;
        if (packageName.startsWith('hl7.fhir.r5.') && version === 'current') {
            packageUrl = `https://build.fhir.org/${packageName}.tgz`;
            // TODO: Figure out how to determine if the cached package is current
            // See: https://chat.fhir.org/#narrow/stream/179252-IG-creation/topic/Registry.20for.20FHIR.20Core.20packages.20.3E.204.2E0.2E1
            if (loadedPackage) {
                log('info', `Downloading ${fullPackageName} since FHIR Package Loader cannot determine if the version in ${cachePath} is the most recent build.`);
            }
        }
        else if (/^current(\$.+)?$/.test(version)) {
            if (PackageCache.isCurrentPackageRefreshNeeded()) {
                PackageCache.markCurrentPackageRefreshed();
                // Authors can reference a specific CI branch by specifying version as current${branchname} (e.g., current$mybranch)
                // See: https://chat.fhir.org/#narrow/stream/179166-implementers/topic/Package.20cache.20-.20multiple.20dev.20versions/near/291131585
                let branch;
                if (version.indexOf('$') !== -1) {
                    branch = version.slice(version.indexOf('$') + 1);
                }
                const baseUrl = 'https://build.fhir.org/ig';
                const res = yield (0, axiosUtils_1.axiosGet)(`${baseUrl}/qas.json`);
                const qaData = res === null || res === void 0 ? void 0 : res.data;
                // Find matching packages and sort by date to get the most recent
                let newestPackage;
                if ((qaData === null || qaData === void 0 ? void 0 : qaData.length) > 0) {
                    let matchingPackages = qaData.filter(p => p['package-id'] === packageName);
                    if (branch == null) {
                        matchingPackages = matchingPackages.filter(p => p.repo.match(/\/(master|main)\/qa\.json$/));
                    }
                    else {
                        matchingPackages = matchingPackages.filter(p => p.repo.endsWith(`/${branch}/qa.json`));
                    }
                    newestPackage = matchingPackages.sort((p1, p2) => {
                        return Date.parse(p2['date']) - Date.parse(p1['date']);
                    })[0];
                }
                if (newestPackage === null || newestPackage === void 0 ? void 0 : newestPackage.repo) {
                    const packagePath = newestPackage.repo.slice(0, -8); // remove "/qa.json" from end
                    const igUrl = `${baseUrl}/${packagePath}`;
                    // get the package.manifest.json for the newest version of the package on build.fhir.org
                    const manifest = yield (0, axiosUtils_1.axiosGet)(`${igUrl}/package.manifest.json`);
                    let cachedPackageJSON;
                    if (fs_extra_1.default.existsSync(path_1.default.join(loadPath, 'package.json'))) {
                        cachedPackageJSON = fs_extra_1.default.readJSONSync(path_1.default.join(loadPath, 'package.json'));
                    }
                    // if the date on the package.manifest.json does not match the date on the cached package
                    // set the packageUrl to trigger a re-download of the package
                    if (((_a = manifest === null || manifest === void 0 ? void 0 : manifest.data) === null || _a === void 0 ? void 0 : _a.date) !== (cachedPackageJSON === null || cachedPackageJSON === void 0 ? void 0 : cachedPackageJSON.date)) {
                        packageUrl = `${igUrl}/package.tgz`;
                        if (cachedPackageJSON) {
                            log('debug', `Cached package date for ${fullPackageName} (${formatDate(cachedPackageJSON.date)}) does not match last build date on build.fhir.org (${formatDate((_b = manifest === null || manifest === void 0 ? void 0 : manifest.data) === null || _b === void 0 ? void 0 : _b.date)})`);
                            log('info', `Cached package ${fullPackageName} is out of date and will be replaced by the more recent version found on build.fhir.org.`);
                        }
                    }
                    else {
                        log('debug', `Cached package date for ${fullPackageName} (${formatDate(cachedPackageJSON.date)}) matches last build date on build.fhir.org (${formatDate((_c = manifest === null || manifest === void 0 ? void 0 : manifest.data) === null || _c === void 0 ? void 0 : _c.date)}), so the cached package will be used`);
                    }
                }
                else {
                    throw new errors_1.CurrentPackageLoadError(fullPackageName);
                }
            }
        }
        else if (!loadedPackage) {
            const customRegistry = (0, customRegistry_1.getCustomRegistry)(log);
            if (customRegistry) {
                packageUrl = yield getDistUrl(customRegistry, packageName, version);
            }
            else {
                packageUrl = `https://packages.fhir.org/${packageName}/${version}`;
            }
        }
        // If the packageUrl is set, we must download the package from that url, and extract it to our local cache
        if (packageUrl) {
            const doDownload = (url) => __awaiter(this, void 0, void 0, function* () {
                log('info', `Downloading ${fullPackageName}... ${url}`);
                const res = yield (0, axiosUtils_1.axiosGet)(url, {
                    responseType: 'arraybuffer'
                });
                if (res === null || res === void 0 ? void 0 : res.data) {
                    log('info', `Downloaded ${fullPackageName}`);
                    // Create a temporary file and write the package to there
                    temp_1.default.track();
                    const tempFile = temp_1.default.openSync();
                    fs_extra_1.default.writeFileSync(tempFile.path, res.data);
                    // Extract the package to a temporary directory
                    const tempDirectory = temp_1.default.mkdirSync();
                    tar_1.default.x({
                        cwd: tempDirectory,
                        file: tempFile.path,
                        sync: true,
                        strict: true
                    });
                    cleanCachedPackage(tempDirectory);
                    // Add or replace the package in the FHIR cache
                    const targetDirectory = path_1.default.join(cachePath, fullPackageName);
                    if (fs_extra_1.default.existsSync(targetDirectory)) {
                        fs_extra_1.default.removeSync(targetDirectory);
                    }
                    fs_extra_1.default.moveSync(tempDirectory, targetDirectory);
                    // Now try to load again from the path
                    loadedPackage = loadFromPath(cachePath, fullPackageName);
                }
                else {
                    log('info', `Unable to download most current version of ${fullPackageName}`);
                }
            });
            try {
                yield doDownload(packageUrl);
            }
            catch (e) {
                if (packageUrl === `https://packages.fhir.org/${packageName}/${version}`) {
                    // It didn't exist in the normal registry.  Fallback to packages2 registry.
                    // See: https://chat.fhir.org/#narrow/stream/179252-IG-creation/topic/Registry.20for.20FHIR.20Core.20packages.20.3E.204.2E0.2E1
                    // See: https://chat.fhir.org/#narrow/stream/179252-IG-creation/topic/fhir.2Edicom/near/262334652
                    packageUrl = `https://packages2.fhir.org/packages/${packageName}/${version}`;
                    try {
                        yield doDownload(packageUrl);
                    }
                    catch (e) {
                        throw new errors_1.PackageLoadError(fullPackageName);
                    }
                }
                else {
                    throw new errors_1.PackageLoadError(fullPackageName, (0, customRegistry_1.getCustomRegistry)());
                }
            }
        }
        if (!loadedPackage) {
            // If we fail again, then we couldn't get the package locally or from online
            throw new errors_1.PackageLoadError(fullPackageName, (0, customRegistry_1.getCustomRegistry)());
        }
        merge(loadedPackage, FHIRDefs);
        log('info', `Loaded package ${fullPackageName}`);
        return FHIRDefs;
    });
}
exports.mergeDependency = mergeDependency;
/**
 * This function takes a package which contains contents at the same level as the "package" folder, and nests
 * all that content within the "package" folder.
 *
 * A package should have the format described here https://confluence.hl7.org/pages/viewpage.action?pageId=35718629#NPMPackageSpecification-Format
 * in which all contents are within the "package" folder. Some packages (ex US Core 3.1.0) have an incorrect format in which folders
 * are not sub-folders of "package", but are instead at the same level. The IG Publisher fixes these packages as described
 * https://chat.fhir.org/#narrow/stream/215610-shorthand/topic/dev.20dependencies, so we should as well.
 *
 * @param {string} packageDirectory - The directory containing the package
 */
function cleanCachedPackage(packageDirectory) {
    if (fs_extra_1.default.existsSync(path_1.default.join(packageDirectory, 'package'))) {
        fs_extra_1.default.readdirSync(packageDirectory)
            .filter(file => file !== 'package')
            .forEach(file => {
            fs_extra_1.default.renameSync(path_1.default.join(packageDirectory, file), path_1.default.join(packageDirectory, 'package', file));
        });
    }
}
exports.cleanCachedPackage = cleanCachedPackage;
function merge(pkg, defs) {
    pkg.defs.forEach(d => defs.add(d));
    defs.addPackageJson(pkg.package, pkg.packageJson);
    defs.package = pkg.package;
}
exports.merge = merge;
/**
 * Locates the targetPackage within the cachePath
 * @param {string} cachePath - The path to the directory containing cached packages
 * @param {string} targetPackage - The name of the package we are trying to load
 * @returns {LoadedPackage} loaded package definitions
 */
function loadFromPath(cachePath, targetPackage) {
    if (PackageCache.contains(targetPackage)) {
        return PackageCache.get(targetPackage);
    }
    const packages = fs_extra_1.default.existsSync(cachePath) ? fs_extra_1.default.readdirSync(cachePath) : [];
    const cachedPackage = packages.find(packageName => packageName.toLowerCase() === targetPackage);
    if (!cachedPackage) {
        return null;
    }
    const result = new LoadedPackage();
    result.package = targetPackage;
    fs_extra_1.default.readdirSync(path_1.default.join(cachePath, cachedPackage, 'package'))
        .filter(file => file.endsWith('.json'))
        .forEach(file => {
        const def = JSON.parse(fs_extra_1.default.readFileSync(path_1.default.join(cachePath, cachedPackage, 'package', file), 'utf-8').trim());
        result.defs.push(def);
        if (file === 'package.json') {
            result.packageJson = def;
        }
    });
    PackageCache.put(targetPackage, result);
    return result;
}
exports.loadFromPath = loadFromPath;
function lookUpLatestVersion(packageName, log = () => { }) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const customRegistry = (0, customRegistry_1.getCustomRegistry)(log);
        let res;
        try {
            if (customRegistry) {
                res = yield (0, axiosUtils_1.axiosGet)(`${customRegistry.replace(/\/$/, '')}/${packageName}`, {
                    responseType: 'json'
                });
            }
            else {
                try {
                    res = yield (0, axiosUtils_1.axiosGet)(`https://packages.fhir.org/${packageName}`, {
                        responseType: 'json'
                    });
                }
                catch (e) {
                    // Fallback to trying packages2.fhir.org
                    res = yield (0, axiosUtils_1.axiosGet)(`https://packages2.fhir.org/packages/${packageName}`, {
                        responseType: 'json'
                    });
                }
            }
        }
        catch (_d) {
            throw new LatestVersionUnavailableError_1.LatestVersionUnavailableError(packageName, customRegistry);
        }
        if ((_c = (_b = (_a = res === null || res === void 0 ? void 0 : res.data) === null || _a === void 0 ? void 0 : _a['dist-tags']) === null || _b === void 0 ? void 0 : _b.latest) === null || _c === void 0 ? void 0 : _c.length) {
            return res.data['dist-tags'].latest;
        }
        else {
            throw new LatestVersionUnavailableError_1.LatestVersionUnavailableError(packageName, customRegistry);
        }
    });
}
exports.lookUpLatestVersion = lookUpLatestVersion;
function lookUpLatestPatchVersion(packageName, version, log = () => { }) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!/^\d+\.\d+\.x$/.test(version)) {
            throw new errors_1.IncorrectWildcardVersionFormatError(packageName, version);
        }
        const customRegistry = (0, customRegistry_1.getCustomRegistry)(log);
        let res;
        try {
            if (customRegistry) {
                res = yield (0, axiosUtils_1.axiosGet)(`${customRegistry.replace(/\/$/, '')}/${packageName}`, {
                    responseType: 'json'
                });
            }
            else {
                try {
                    res = yield (0, axiosUtils_1.axiosGet)(`https://packages.fhir.org/${packageName}`, {
                        responseType: 'json'
                    });
                }
                catch (e) {
                    // Fallback to trying packages2.fhir.org
                    res = yield (0, axiosUtils_1.axiosGet)(`https://packages2.fhir.org/packages/${packageName}`, {
                        responseType: 'json'
                    });
                }
            }
        }
        catch (_b) {
            throw new LatestVersionUnavailableError_1.LatestVersionUnavailableError(packageName, customRegistry, true);
        }
        if ((_a = res === null || res === void 0 ? void 0 : res.data) === null || _a === void 0 ? void 0 : _a.versions) {
            const versions = Object.keys(res.data.versions);
            const latest = (0, semver_1.maxSatisfying)(versions, version);
            if (latest == null) {
                throw new LatestVersionUnavailableError_1.LatestVersionUnavailableError(packageName, customRegistry, true);
            }
            return latest;
        }
        else {
            throw new LatestVersionUnavailableError_1.LatestVersionUnavailableError(packageName, customRegistry, true);
        }
    });
}
exports.lookUpLatestPatchVersion = lookUpLatestPatchVersion;
/**
 * Takes a date in format YYYYMMDDHHmmss and converts to YYYY-MM-DDTHH:mm:ss
 * @param {string} date - The date to format
 * @returns {string} the formatted date
 */
function formatDate(date) {
    return date
        ? date.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6')
        : '';
}
//# sourceMappingURL=load.js.map