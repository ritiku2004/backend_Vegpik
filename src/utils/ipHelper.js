const os = require('os');

const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const netInterface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (netInterface.family === 'IPv4' && !netInterface.internal) {
        return netInterface.address;
      }
    }
  }
  return 'localhost'; // Fallback
};

const getFormattedUrl = (req, fileOrFilename) => {
  let filename = fileOrFilename;
  let subDir = '';

  // If a Multer file object is passed, extract filename and destination-based subfolder
  if (fileOrFilename && typeof fileOrFilename === 'object') {
    filename = fileOrFilename.filename;
    const destination = fileOrFilename.destination;
    if (destination) {
      const normalizedDest = destination.replace(/\\/g, '/');
      const baseDir = (process.env.UPLOAD_DIR || '').replace(/\\/g, '/').replace(/\/+$/, '');
      
      if (baseDir && normalizedDest.startsWith(baseDir)) {
        subDir = normalizedDest.substring(baseDir.length);
      } else {
        const uploadsIndex = normalizedDest.lastIndexOf('/uploads');
        if (uploadsIndex !== -1) {
          subDir = normalizedDest.substring(uploadsIndex + 9); // everything after '/uploads/'
        }
      }
    }
  } 

  // Sanitize subDir: strip any starting/trailing slashes
  subDir = subDir.replace(/^\/+|\/+$/g, '');

  const baseUrl = process.env.BASE_URL;
  let formattedUrl;
  
  if (baseUrl) {
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    formattedUrl = `${base}/${subDir ? subDir + '/' : ''}${filename}`;
  } else {
    let host = req.get('host'); // e.g. "localhost:3000" or "192.168.1.5:3000"
    
    // If the host is localhost or 127.0.0.1, replace it with the dynamic local IP address.
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      const localIp = getLocalIpAddress();
      host = host.replace('localhost', localIp).replace('127.0.0.1', localIp);
    }
    
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    formattedUrl = `${protocol}://${host}/uploads/${subDir ? subDir + '/' : ''}${filename}`;
  }
  
  return formattedUrl;
};
 
module.exports = {
  getLocalIpAddress,
  getFormattedUrl
};
