import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

function processFile(filePath) {
    if (!filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace route('admin.models.action', arg)
    let modified = content.replace(/route\('admin\.([a-z]+)\.([a-z]+)',\s*([^)]+)\)/g, 'adminRoutes.$1.$2.url($3)');
    
    // Replace route('admin.models.action')
    modified = modified.replace(/route\('admin\.([a-z]+)\.([a-z]+)'\)/g, 'adminRoutes.$1.$2.url()');

    // Replace route('admin.dashboard')
    modified = modified.replace(/route\('admin\.dashboard'\)/g, 'adminRoutes.dashboard.url()');

    if (modified !== original) {
        // needs import adminRoutes from '@/routes/admin';
        if (!modified.includes('import adminRoutes from')) {
            modified = modified.replace(/(import .*?;)/, `$1\nimport adminRoutes from '@/routes/admin';`);
        }
        fs.writeFileSync(filePath, modified, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

walkDir('./resources/js/Pages/Admin', processFile);
walkDir('./resources/js/components/Layout', processFile); // admin layout also uses route()
