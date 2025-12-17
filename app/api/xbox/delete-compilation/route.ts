import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

export async function DELETE(request: NextRequest) {
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

    // Delete the blob
    await blobClient.delete();

    return NextResponse.json({ success: true, message: 'Compilation deleted successfully' });
  } catch (error) {
    console.error('Error deleting compilation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete compilation' },
      { status: 500 }
    );
  }
}
