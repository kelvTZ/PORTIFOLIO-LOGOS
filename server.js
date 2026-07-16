const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const LOGOS_DIR = 'C:\\Users\\lexke\\Downloads\\PORTIFOLIO LOGOS';
const ANIMALS_DIR = 'C:\\Users\\lexke\\Downloads\\logos animais';
const PROFILE_DIR = 'C:\\Users\\lexke\\Downloads\\foto';
const FRAMES_DIR = 'C:\\Users\\lexke\\Downloads\\ezgif-8483c211edb3c0ed-jpg';
const WORKSPACE_DIR = __dirname;

// Helper to get content type based on extension
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.html': return 'text/html; charset=utf-8';
        case '.css': return 'text/css; charset=utf-8';
        case '.js': return 'application/javascript; charset=utf-8';
        case '.json': return 'application/json; charset=utf-8';
        case '.png': return 'image/png';
        case '.jpg': return 'image/jpeg';
        case '.jpeg': return 'image/jpeg';
        case '.gif': return 'image/gif';
        case '.svg': return 'image/svg+xml';
        default: return 'application/octet-stream';
    }
}

// Function to recursively find files in a directory
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

const server = http.createServer((req, res) => {
    // Decode URI to handle spaces and accents
    let decodedUrl = '';
    try {
        decodedUrl = decodeURIComponent(req.url);
    } catch (e) {
        res.statusCode = 400;
        res.end('Bad Request');
        return;
    }

    // Clean up url (remove query params)
    const cleanUrl = decodedUrl.split('?')[0];

    // API endpoint to return all logos, profile picture, and video frames
    if (cleanUrl === '/api/logos') {
        try {
            const secao1Dir = path.join(LOGOS_DIR, 'seçao 1');
            const secao2Dir = path.join(LOGOS_DIR, 'seçao 2');
            const secao3Dir = path.join(LOGOS_DIR, 'seçao 3');

            const profileFiles = getFilesRecursively(PROFILE_DIR, '/profile-photo');
            const secao1Files = getFilesRecursively(secao1Dir, '/logos/seçao 1');
            const secao2Files = getFilesRecursively(secao2Dir, '/logos/seçao 2');
            const secao3Files = getFilesRecursively(secao3Dir, '/logos/seçao 3');
            const secaoAnimaisFiles = getFilesRecursively(ANIMALS_DIR, '/logos-animais');
            
            // Get frames and sort them numerically
            let frameFiles = getFilesRecursively(FRAMES_DIR, '/video-frames');
            frameFiles.sort((a, b) => {
                const numA = parseInt(a.replace(/[^0-9]/g, ''), 10);
                const numB = parseInt(b.replace(/[^0-9]/g, ''), 10);
                return numA - numB;
            });

            const data = {
                profile: profileFiles.length > 0 ? profileFiles[0] : null,
                secao1: secao1Files,
                secao2: secao2Files,
                secao3: secao3Files,
                secaoAnimais: secaoAnimaisFiles,
                videoFrames: frameFiles,
                all: [...secao1Files, ...secao2Files, ...secao3Files, ...secaoAnimaisFiles]
            };

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(data));
        } catch (error) {
            console.error('Error generating logos list:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Error generating logos list: ' + error.message);
        }
        return;
    }

    // Serve files from the LOGOS_DIR (external folder)
    if (cleanUrl.startsWith('/logos/')) {
        const relativePath = cleanUrl.substring(7); // remove '/logos/'
        const localPath = path.join(LOGOS_DIR, relativePath);
        
        // Security check: ensure the resolved path is inside LOGOS_DIR
        const relative = path.relative(LOGOS_DIR, localPath);
        const isSafe = !relative.startsWith('..') && !path.isAbsolute(relative);
        
        if (isSafe && fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
            res.writeHead(200, { 'Content-Type': getContentType(localPath) });
            fs.createReadStream(localPath).pipe(res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Logo not found or Access Denied');
        }
        return;
    }

    // Serve files from the ANIMALS_DIR (external folder)
    if (cleanUrl.startsWith('/logos-animais/')) {
        const relativePath = cleanUrl.substring(15); // remove '/logos-animais/'
        const localPath = path.join(ANIMALS_DIR, relativePath);
        
        // Security check
        const relative = path.relative(ANIMALS_DIR, localPath);
        const isSafe = !relative.startsWith('..') && !path.isAbsolute(relative);
        
        if (isSafe && fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
            res.writeHead(200, { 'Content-Type': getContentType(localPath) });
            fs.createReadStream(localPath).pipe(res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Animal logo not found or Access Denied');
        }
        return;
    }

    // Serve files from the PROFILE_DIR (external folder)
    if (cleanUrl.startsWith('/profile-photo/')) {
        const relativePath = cleanUrl.substring(15); // remove '/profile-photo/'
        const localPath = path.join(PROFILE_DIR, relativePath);
        
        // Security check
        const relative = path.relative(PROFILE_DIR, localPath);
        const isSafe = !relative.startsWith('..') && !path.isAbsolute(relative);
        
        if (isSafe && fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
            res.writeHead(200, { 'Content-Type': getContentType(localPath) });
            fs.createReadStream(localPath).pipe(res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Profile photo not found or Access Denied');
        }
        return;
    }

    // Serve files from the FRAMES_DIR (external folder)
    if (cleanUrl.startsWith('/video-frames/')) {
        const relativePath = cleanUrl.substring(14); // remove '/video-frames/'
        const localPath = path.join(FRAMES_DIR, relativePath);
        
        // Security check
        const relative = path.relative(FRAMES_DIR, localPath);
        const isSafe = !relative.startsWith('..') && !path.isAbsolute(relative);
        
        if (isSafe && fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
            res.writeHead(200, { 'Content-Type': getContentType(localPath) });
            fs.createReadStream(localPath).pipe(res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Frame not found or Access Denied');
        }
        return;
    }

    // Serve files from workspace (current directory)
    let localFilePath = path.join(WORKSPACE_DIR, cleanUrl === '/' ? 'code.html' : cleanUrl);
    
    // Security check: ensure path is inside workspace
    const relative = path.relative(WORKSPACE_DIR, localFilePath);
    const isSafe = !relative.startsWith('..');

    if (isSafe && fs.existsSync(localFilePath) && fs.statSync(localFilePath).isFile()) {
        res.writeHead(200, { 'Content-Type': getContentType(localFilePath) });
        fs.createReadStream(localFilePath).pipe(res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('File not found');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Serving workspace from: ${WORKSPACE_DIR}`);
    console.log(`Serving logos from: ${LOGOS_DIR}`);
    console.log(`Serving animal logos from: ${ANIMALS_DIR}`);
    console.log(`Serving profile from: ${PROFILE_DIR}`);
    console.log(`Serving video frames from: ${FRAMES_DIR}`);
});
