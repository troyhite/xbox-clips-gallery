const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');
const cors = require('cors');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 8080;

// Configuration
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || 'galleryclipsvi';
const containerName = 'compilations';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'video-compilation', ffmpeg: 'available' });
});

// Time conversion utility
function timeToSeconds(timeStr) {
  const parts = timeStr.split(':');
  const hours = parts.length === 3 ? parseFloat(parts[0]) : 0;
  const minutes = parts.length === 3 ? parseFloat(parts[1]) : parseFloat(parts[0]);
  const seconds = parts.length === 3 ? parseFloat(parts[2]) : parseFloat(parts[1]);
  return hours * 3600 + minutes * 60 + seconds;
}

// Download video from URL
async function downloadVideo(videoUrl, outputPath) {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(arrayBuffer));
}

// Upload to Azure Storage
async function uploadToStorage(filePath, blobName) {
  let blobServiceClient;
  
  // Try connection string first, then fall back to managed identity
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (connectionString) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  } else {
    const credential = new DefaultAzureCredential();
    blobServiceClient = new BlobServiceClient(
      `https://${storageAccountName}.blob.core.windows.net`,
      credential
    );
  }

  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  // Ensure container exists (private access - no public access allowed on this storage account)
  await containerClient.createIfNotExists();
  
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const fileContent = await fs.readFile(filePath);
  await blockBlobClient.uploadData(fileContent, {
    blobHTTPHeaders: {
      blobContentType: 'video/mp4',
    },
  });

  // Generate user delegation SAS URL (works with managed identity)
  const startsOn = new Date();
  const expiresOn = new Date(startsOn.getTime() + 60 * 60 * 1000); // 1 hour from now
  
  const userDelegationKey = await blobServiceClient.getUserDelegationKey(startsOn, expiresOn);
  
  const sasQueryParams = generateBlobSASQueryParameters({
    containerName: containerName,
    blobName: blobName,
    permissions: BlobSASPermissions.parse('r'),
    startsOn: startsOn,
    expiresOn: expiresOn,
  }, userDelegationKey, storageAccountName);

  return `${blockBlobClient.url}?${sasQueryParams.toString()}`;
}

// Main compilation endpoint
app.post('/compile', async (req, res) => {
  const startTime = Date.now();
  let tempDir;

  try {
    const { videoId, clips } = req.body;

    // Validate clips have videoUrl
    if (!videoId || !clips || !Array.isArray(clips) || clips.length === 0) {
      return res.status(400).json({
        error: 'Invalid request. Required: videoId, clips array with videoUrl for each clip',
      });
    }

    const missingUrl = clips.some(c => !c.videoUrl);
    if (missingUrl) {
      return res.status(400).json({
        error: 'All clips must have a videoUrl property',
      });
    }

    // Group clips by source video URL
    const uniqueVideos = [...new Set(clips.map(c => c.videoUrl))];
    console.log(`[${videoId}] Starting compilation with ${clips.length} clips from ${uniqueVideos.length} source video(s)`);

    // Create temp directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'compilation-'));
    const outputPath = path.join(tempDir, 'compilation.mp4');
    const concatListPath = path.join(tempDir, 'concat.txt');

    // Download all unique source videos
    const videoCache = new Map();
    for (let i = 0; i < uniqueVideos.length; i++) {
      const videoUrl = uniqueVideos[i];
      const inputPath = path.join(tempDir, `source-${i}.mp4`);
      console.log(`[${videoId}] Downloading source video ${i + 1}/${uniqueVideos.length}...`);
      await downloadVideo(videoUrl, inputPath);
      videoCache.set(videoUrl, inputPath);
    }

    // Extract each clip from its respective source video
    const clipPaths = [];
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const clipPath = path.join(tempDir, `clip-${i}.mp4`);
      const inputPath = videoCache.get(clip.videoUrl);
      const startSec = timeToSeconds(clip.start);
      const endSec = timeToSeconds(clip.end);
      const duration = endSec - startSec;

      console.log(`[${videoId}] Extracting clip ${i + 1}/${clips.length}: ${clip.start} to ${clip.end} (${duration}s) from source video`);

      // Extract clip using FFmpeg (re-encode for reliable concatenation)
      const extractCmd = `ffmpeg -ss ${startSec} -i "${inputPath}" -t ${duration} -c:v libx264 -preset ultrafast -crf 23 -c:a aac "${clipPath}" -y`;
      const { stdout, stderr } = await execAsync(extractCmd);
      if (stderr && stderr.includes('error')) {
        console.error(`[${videoId}] FFmpeg stderr for clip ${i}:`, stderr);
      }

      // Verify clip was created and check its size
      const stats = await fs.stat(clipPath);
      console.log(`[${videoId}] Clip ${i} created: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      clipPaths.push(clipPath);
    }

    // Create concat list file
    const concatContent = clipPaths.map(p => `file '${p}'`).join('\n');
    await fs.writeFile(concatListPath, concatContent);
    console.log(`[${videoId}] Concat file contents:\n${concatContent}`);

    // Concatenate clips (re-encode to ensure compatibility)
    console.log(`[${videoId}] Concatenating ${clips.length} clips...`);
    const concatCmd = `ffmpeg -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -preset ultrafast -crf 23 -c:a aac "${outputPath}" -y`;
    const { stdout: concatOut, stderr: concatErr } = await execAsync(concatCmd);
    if (concatErr && concatErr.includes('error')) {
      console.error(`[${videoId}] FFmpeg concat stderr:`, concatErr);
    }
    
    // Verify output file
    const outputStats = await fs.stat(outputPath);
    console.log(`[${videoId}] Output file size: ${(outputStats.size / 1024 / 1024).toFixed(2)} MB`);

    // Upload to Azure Storage
    console.log(`[${videoId}] Uploading compilation to Azure Storage...`);
    const blobName = `${videoId}-highlights-${Date.now()}.mp4`;
    const compilationUrl = await uploadToStorage(outputPath, blobName);

    // Clean up temp files
    await fs.rm(tempDir, { recursive: true, force: true });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[${videoId}] Compilation complete in ${duration}s`);

    res.json({
      success: true,
      videoId,
      compilationUrl,
      clipsCount: clips.length,
      processingTime: `${duration}s`,
    });

  } catch (error) {
    console.error('Compilation error:', error);
    
    // Clean up on error
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }

    res.status(500).json({
      error: error.message || 'Failed to create compilation',
      details: error.toString(),
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎬 Video Compilation Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Compilation endpoint: POST http://localhost:${PORT}/compile`);
});
