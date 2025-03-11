import express from 'express';
import { DOMParser } from 'xmldom';
import { readdir, readFile, mkdir } from 'fs/promises';
import { join, relative } from 'path';
import { existsSync } from 'fs';
import libxml from 'libxmljs';


const app = express();
const PORT = 3005;
const XSD_DIR = './xsd';

// Increase JSON limit and add CORS headers
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Handle preflight requests
app.options('*', (req, res) => {
  res.sendStatus(200);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Ensure XSD directory exists
if (!existsSync(XSD_DIR)) {
  await mkdir(XSD_DIR);
}

async function getDirectoryStructure(dir) {
  try {
    const items = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      items.map(async item => {
        const path = join(dir, item.name);
        const relativePath = relative(XSD_DIR, path);
        
        if (item.isDirectory()) {
          const children = await getDirectoryStructure(path);
          return {
            name: item.name,
            path: relativePath,
            type: 'directory',
            children
          };
        } else if (item.name.endsWith('.xsd')) {
          return {
            name: item.name,
            path: relativePath,
            type: 'file'
          };
        }
        return null;
      })
    );
    
    return files.filter(Boolean);
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
}

app.get('/xsd-tree', async (req, res, next) => {
  try {
    const structure = await getDirectoryStructure(XSD_DIR);
    res.json(structure);
  } catch (error) {
    next(error);
  }
});

app.get('/xsd-content/:path(*)', async (req, res, next) => {
  try {
    const filePath = join(XSD_DIR, req.params.path);
    const content = await readFile(filePath, 'utf-8');
    res.json({ content });
  } catch (error) {
    next(error);
  }
});

app.post('/validate', (req, res) => {
  try {
    const { xmlContent, xsdContent } = req.body;
    
    if (!xmlContent || !xsdContent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both XML and XSD content are required' 
      });
    }

    console.log('Received validation request');
    console.log('XML length:', xmlContent.length);
    console.log('XSD length:', xsdContent.length);

    // Parse XML and XSD
    let xmlDoc, xsdDoc;
    
    try {
      xmlDoc = libxml.parseXml(xmlContent);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid XML format',
        error: error.message
      });
    }
    
    try {
      xsdDoc = libxml.parseXml(xsdContent);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid XSD format',
        error: error.message
      });
    }

    // Validate XML against XSD
    try {
      const isValid = xmlDoc.validate(xsdDoc);

      if (isValid) {
        return res.json({ 
          success: true, 
          message: 'XML is valid against XSD.' 
        });
      } else {
        const validationErrors = xmlDoc.validationErrors;
        const errorMessages = validationErrors.map(error => error.message);
        
        return res.json({ 
          success: false, 
          message: 'XML validation failed', 
          errors: errorMessages 
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error during validation process',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during validation', 
      error: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});