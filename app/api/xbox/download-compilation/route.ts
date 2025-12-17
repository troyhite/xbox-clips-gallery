import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const blobName = searchParams.get('name');

    if (!blobName) {
      return NextResponse.json({ error: 'Blob name is required' }, { status: 400 });
    }

    const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!storageAccountName) {
      return NextResponse.json({ error: 'Storage account not configured' }, { status: 500 });
    }

    let blobServiceClient: BlobServiceClient;

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
    const blobClient = containerClient.getBlobClient(blobName);

    // Download blob
    const downloadResponse = await blobClient.download();
    
    if (!downloadResponse.readableStreamBody) {
      return NextResponse.json({ error: 'Failed to download blob' }, { status: 500 });
    }

    // Stream the blob to the client
    const headers = new Headers();
    headers.set('Content-Type', downloadResponse.contentType || 'video/mp4');
    headers.set('Content-Disposition', `attachment; filename="${blobName}"`);
    headers.set('Content-Length', downloadResponse.contentLength?.toString() || '0');

    return new NextResponse(downloadResponse.readableStreamBody as any, {
      headers,
    });
  } catch (error) {
    console.error('Error downloading compilation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to download compilation' },
      { status: 500 }
    );
  }
}
