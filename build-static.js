const fs = require('fs');
const path = require('path');

const LOGOS_DIR = 'C:\\Users\\lexke\\Downloads\\PORTIFOLIO LOGOS';
const ANIMALS_DIR = 'C:\\Users\\lexke\\Downloads\\PORTIFOLIO LOGOS\\logos animais';
const PROFILE_DIR = 'C:\\Users\\lexke\\Downloads\\foto';
const FRAMES_DIR = 'C:\\Users\\lexke\\Downloads\\ezgif-8483c211edb3c0ed-jpg';
const WORKSPACE_DIR = __dirname;

// Helper to clean directory if it exists
function cleanDirSync(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
    }
    fs.mkdirSync(dirPath, { recursive: true });
}

// Helper to copy directory recursively
function copyDirSync(src, dest) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Function to recursively find files relative to workspace
function getFilesRecursively(dirPath, baseRoute = '') {
    let results = [];
    if (!fs.existsSync(dirPath)) return results;
    
    const list = fs.readdirSync(dirPath);
    list.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        const routePath = `${baseRoute}/${file}`;
        if (stat && stat.isDirectory()) {
            results = results.concat(getFilesRecursively(fullPath, routePath));
        } else {
            results.push(routePath);
        }
    });
    return results;
}

console.log('Cleaning assets directories...');
const destLogos = path.join(WORKSPACE_DIR, 'logos');
const destAnimals = path.join(WORKSPACE_DIR, 'logos-animais');
const destProfile = path.join(WORKSPACE_DIR, 'profile-photo');
const destFrames = path.join(WORKSPACE_DIR, 'video-frames');

cleanDirSync(destLogos);
cleanDirSync(destAnimals);
cleanDirSync(destProfile);
cleanDirSync(destFrames);

console.log('Copying assets into project directory for static hosting...');
copyDirSync(LOGOS_DIR, destLogos);
copyDirSync(ANIMALS_DIR, destAnimals);
copyDirSync(PROFILE_DIR, destProfile);
copyDirSync(FRAMES_DIR, destFrames);

console.log('Assets copied successfully.');

// Get list of relative file paths for the static script
const secao1Files = getFilesRecursively(path.join(destLogos, 'seçao 1'), 'logos/seçao 1');
const secao2Files = getFilesRecursively(path.join(destLogos, 'seçao 2'), 'logos/seçao 2');
const secao3Files = getFilesRecursively(path.join(destLogos, 'seçao 3'), 'logos/seçao 3');
const secaoAnimaisFiles = getFilesRecursively(destAnimals, 'logos-animais');
const profileFiles = getFilesRecursively(destProfile, 'profile-photo');
let frameFiles = getFilesRecursively(destFrames, 'video-frames');

frameFiles.sort((a, b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, ''), 10);
    const numB = parseInt(b.replace(/[^0-9]/g, ''), 10);
    return numA - numB;
});

const staticData = {
    profile: profileFiles.length > 0 ? profileFiles[0] : null,
    secao1: secao1Files,
    secao2: secao2Files,
    secao3: secao3Files,
    secaoAnimais: secaoAnimaisFiles,
    videoFrames: frameFiles,
    all: [...secao1Files, ...secao2Files, ...secao3Files, ...secaoAnimaisFiles]
};

console.log('Generating static index.html from code.html...');

const codeHtmlPath = path.join(WORKSPACE_DIR, 'code.html');
const indexHtmlPath = path.join(WORKSPACE_DIR, 'index.html');

let htmlContent = fs.readFileSync(codeHtmlPath, 'utf8');

// Replace the API fetch block with a direct static promise resolved with staticData
const targetFetch = `        fetch('/api/logos')
            .then(res => res.json())
            .then(data => {`;

const staticReplacement = `        // Static data replacement for GitHub Pages / Vercel hosting
        const staticData = ${JSON.stringify(staticData, null, 4)};
        
        Promise.resolve(staticData)
            .then(data => {`;

if (htmlContent.includes(targetFetch)) {
    htmlContent = htmlContent.replace(targetFetch, staticReplacement);
    fs.writeFileSync(indexHtmlPath, htmlContent, 'utf8');
    console.log('index.html generated successfully.');
} else {
    console.error('Could not find API fetch block in code.html. Verify the structure.');
}
