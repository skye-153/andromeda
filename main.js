const { app, BrowserWindow, ipcMain, shell } = require('electron');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Import your Mongoose models
const Map = require('./andromeda/src/models/Map.js');
const Node = require('./andromeda/src/models/Node.js');
const Connection = require('./andromeda/src/models/Connection.js');
const File = require('./andromeda/src/models/File.js');


// MongoDB connection URI
const MONGODB_URI = 'mongodb://localhost:27017/andromeda';

// Directory to save attached files
const filesDirectory = path.join(app.getPath('userData'), 'attached-files');

// Connect to MongoDB
async function connectDb() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // In a real app, you might want to show an error message to the user
    // and potentially exit the application gracefully.
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadURL('http://localhost:9002'); // Your Next.js app URL

  // Open DevTools (optional)
  // win.webContents.openDevTools();
}

app.whenReady().then(async () => {
  await connectDb(); // Connect to MongoDB when the app is ready
  createWindow();

  // Create the directory for attached files if it doesn't exist
  if (!fs.existsSync(filesDirectory)) {
    fs.mkdirSync(filesDirectory);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Disconnect from MongoDB when all windows are closed (optional, but good practice)
    mongoose.disconnect()
      .then(() => console.log('MongoDB disconnected.'))
      .catch(error => console.error('Error disconnecting MongoDB:', error));

    app.quit();
  }
});

// --- IPC Handlers ---

// Handler to save map data
ipcMain.on('save-map-data', async (event, mapData) => {
  try {
    let map;
    if (mapData._id) {
      // If mapData has an _id, try to find and update the existing map
      map = await Map.findById(mapData._id);
      if (!map) {
        // If map not found (e.g., deleted externally), create a new one
        map = new Map();
      }
    } else {
      // If no _id, create a new map
      map = new Map();
    }

    map.name = mapData.name || 'Untitled Map';

    // --- Handle Nodes ---
    const savedNodes = await Promise.all(mapData.nodes.map(async (nodeData) => {
      let node;
      if (nodeData._id) {
        // Find and update existing node
        node = await Node.findById(nodeData._id);
        if (!node) {
          // If node not found, create a new one (shouldn't happen with proper data flow)
           console.warn(`Node with ID ${nodeData._id} not found, creating new.`);
           node = new Node({ _id: nodeData._id }); // Try to preserve ID if provided
        }
      } else {
        // Create a new node
        node = new Node();
      }

      // Update node properties
      node.position = nodeData.position;
      node.title = nodeData.title;
      node.description = nodeData.description;
      node.links = nodeData.links;
      node.isDone = nodeData.isDone;
      // Preserve temporary frontend ID for reference if needed
      node.id = nodeData.id;

      // --- Handle Files within Node ---
      const savedFiles = await Promise.all(nodeData.files.map(async (fileData) => {
        let file;
        if (fileData._id) {
          // Find and update existing file
          file = await File.findById(fileData._id);
           if (!file) {
             console.warn(`File with ID ${fileData._id} not found, creating new.`);
             file = new File({ _id: fileData._id });
           }
        } else {
          // Create a new file
          file = new File();
          // Save the file content to the local file system if data is present (new file)
          if (fileData.data) {
            const filePath = path.join(filesDirectory, fileData.name);
             try {
               fs.writeFileSync(filePath, fileData.data);
               file.path = filePath; // Store the local path
             } catch (fileSaveError) {
               console.error(`Error saving file ${fileData.name}:`, fileSaveError);
               // Handle file saving errors (e.g., notify user)
               // You might not want to save the File document if saving fails
               return null; // Skip saving this file document
             }
          } else {
            console.warn(`New file ${fileData.name} has no data to save.`);
             return null; // Skip saving this file document
          }
        }
        // Update file properties
        file.name = fileData.name;
        // Preserve temporary frontend ID for reference if needed
         file.id = fileData.id;

        return file.save(); // Save the File document
      }).filter(file => file !== null)); // Filter out nulls from failed file saves

      // Link saved files to the node
       node.files = savedFiles.map(file => file._id);

      return node.save(); // Save the Node document
    }));
    // Link saved nodes to the map
    map.nodes = savedNodes.map(node => node._id);

    // --- Handle Connections ---
    // This is a basic implementation. You'll need to handle updates,
    // deletions, and additions based on changes in mapData.connections.
    // For simplicity here, we'll just assume connections are provided
    // and save them (handling existing/new based on _id).
     const savedConnections = await Promise.all(mapData.connections.map(async (connectionData) => {
       let connection;
       if (connectionData._id) {
         connection = await Connection.findById(connectionData._id);
          if (!connection) {
            console.warn(`Connection with ID ${connectionData._id} not found, creating new.`);
            connection = new Connection({ _id: connectionData._id });
          }
       } else {
         connection = new Connection();
       }
       // Ensure startNode and endNode are ObjectIds (strings) if they are populated Node objects
       connection.startNode = typeof connectionData.startNode === 'string' ? connectionData.startNode : connectionData.startNode._id;
       connection.endNode = typeof connectionData.endNode === 'string' ? connectionData.endNode : connectionData.endNode._id;

       return connection.save();
     }));
     map.connections = savedConnections.map(connection => connection._id);


    await map.save(); // Save the Map document

    // After saving, load the map again with populated data to send back to the frontend
    const savedAndPopulatedMap = await Map.findById(map._id)
      .populate({
        path: 'nodes',
        populate: { path: 'files' } // Populate files within nodes
      })
      .populate('connections')
      .exec();


    console.log('Map data saved:', savedAndPopulatedMap);
    // Send the saved and populated map data back to the renderer process
    event.reply('save-map-data-response', { success: true, map: savedAndPopulatedMap });

  } catch (error) {
    console.error('Error saving map data:', error);
    event.reply('save-map-data-response', { success: false, error: error.message });
  }
});

// Handler to load all maps (sends back only basic map info)
ipcMain.on('load-maps', async (event) => {
  try {
    // Fetch only basic map information (e.g., _id and name)
    const maps = await Map.find().select('_id name').exec();
    console.log('Maps loaded (basic info):', maps);
    event.reply('load-maps-response', { success: true, maps });
  } catch (error) {
    console.error('Error loading maps:', error);
    event.reply('load-maps-response', { success: false, error: error.message });
  }
});

// Handler to load a specific map by ID (with populated data)
ipcMain.on('load-map-by-id', async (event, mapId) => {
  try {
    const map = await Map.findById(mapId)
      .populate({
        path: 'nodes',
        populate: { path: 'files' } // Populate files within nodes
      })
      .populate('connections')
      .exec();

    console.log('Map loaded by ID (populated):', map);
    event.reply('load-map-by-id-response', { success: true, map });
  } catch (error) {
    console.error('Error loading map by ID:', error);
    event.reply('load-map-by-id-response', { success: false, error: error.message });
  }
});

// Handler to open a local file
ipcMain.on('open-local-file', (event, filePath) => {
  if (!filePath) {
    console.warn("Attempted to open file with empty path.");
    return;
  }
  shell.openPath(filePath)
    .then(() => console.log('File opened:', filePath))
    .catch((error) => console.error('Error opening file:', error));
});

// Handler to delete a file by ID
ipcMain.on('delete-file', async (event, fileId) => {
  try {
    const file = await File.findById(fileId);
    if (file) {
      // Delete the file from the local file system
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          console.log('File deleted from local storage:', file.path);
        } catch (unlinkError) {
          console.error('Error deleting file from local storage:', unlinkError);
          // Continue with database deletion even if file deletion fails
        }
      }
      // Delete the file document from MongoDB
      await file.remove();
      console.log('File document deleted from DB:', fileId);
      event.reply('delete-file-response', { success: true, fileId });
    } else {
      console.warn('File not found for deletion:', fileId);
      event.reply('delete-file-response', { success: false, error: 'File not found.' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    event.reply('delete-file-response', { success: false, error: error.message });
  }
});

// Handler to delete a node by ID
ipcMain.on('delete-node', async (event, nodeId) => {
  try {
    // Find the node
    const node = await Node.findById(nodeId);
    if (node) {
      // Delete associated files
      if (node.files && node.files.length > 0) {
        await Promise.all(node.files.map(async (fileId) => {
          try {
            const file = await File.findById(fileId);
            if (file) {
               if (file.path && fs.existsSync(file.path)) {
                 fs.unlinkSync(file.path);
                 console.log('Associated file deleted from local storage:', file.path);
               }
               await file.remove();
               console.log('Associated file document deleted from DB:', fileId);
            }
          } catch (fileDeleteError) {
            console.error(`Error deleting associated file ${fileId}:`, fileDeleteError);
          }
        }));
      }

      // Delete associated connections (either where this node is startNode or endNode)
      await Connection.deleteMany({ $or: [{ startNode: nodeId }, { endNode: nodeId }] });
      console.log('Associated connections deleted for node:', nodeId);

      // Delete the node document
      await node.remove();
      console.log('Node document deleted from DB:', nodeId);
      event.reply('delete-node-response', { success: true, nodeId });
    } else {
      console.warn('Node not found for deletion:', nodeId);
      event.reply('delete-node-response', { success: false, error: 'Node not found.' });
    }
  } catch (error) {
    console.error('Error deleting node:', error);
    event.reply('delete-node-response', { success: false, error: error.message });
  }
});
