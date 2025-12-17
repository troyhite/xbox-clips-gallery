import { NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

export async function GET() {
  try {
    const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!storageAccountName) {
      return NextResponse.json(
        { error: 'Storage account not configured' },
        { status: 500 }
      );
    }

    let blobServiceClient: BlobServiceClient;

    // Use connection string for local development, managed identity for production
    if (connectionString) {
      blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    } else {
      const credential = new DefaultAzureCredential();
      blobServiceClient = new BlobServiceClient(
        `https://${storageAccountName}.blob.core.windows.net`,
        credential
      );
    }

    const containerClient = blobServiceClient.getContainerClient('compilations');

    // List all blobs in the container
    const compilations = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      // Use API proxy endpoint for downloads instead of direct blob URLs
      const downloadUrl = `/api/xbox/download-compilation?name=${encodeURIComponent(blob.name)}`;
      
      compilations.push({
        name: blob.name,
        url: downloadUrl,
        createdOn: blob.properties.createdOn?.toISOString() || new Date().toISOString(),
        size: blob.properties.contentLength || 0,
      });
    }

    // Sort by creation date, newest first
    compilations.sort((a, b) => 
      new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
    );

    return NextResponse.json({ compilations });
  } catch (error) {
    console.error('Error fetching compilations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch compilations' },
      { status: 500 }
    );
  }
}
