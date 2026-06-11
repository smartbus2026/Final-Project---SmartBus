const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace <select className="..."> with <select className="... custom-select">
  content = content.replace(/<select\s+([^>]*?)className=(["'])(.*?)\2/g, (match, p1, quote, classNames) => {
    if (!classNames.includes('custom-select')) {
      return `<select ${p1}className=${quote}${classNames} custom-select${quote}`;
    }
    return match;
  });

  // Also replace <select> without className
  content = content.replace(/<select(?![^>]*className=)([^>]*)>/g, '<select className="custom-select"$1>');

  // Replace overflow-y-auto or overflow-x-auto with overflow-y-auto no-scrollbar
  content = content.replace(/className=(["'])([^"']*(?:overflow-y-auto|overflow-x-auto|overflow-auto)[^"']*)\1/g, (match, quote, classNames) => {
    if (!classNames.includes('no-scrollbar')) {
      return `className=${quote}${classNames} no-scrollbar${quote}`;
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated', filePath);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDir = fs.statSync(dirPath).isDirectory();
    if (isDir) walkDir(dirPath);
    else if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) processFile(dirPath);
  });
}

walkDir('e:\\\\ITIFRONTEND\\\\Final-Project---SmartBus\\\\smart-bus-Frontend\\\\src');
