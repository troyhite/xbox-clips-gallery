'use client';

import { useState, useEffect } from 'react';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface Compilation {
  name: string;
  url: string;
  createdOn: string;
  size: number;
}

export default function CompilationsGrid() {
  const [compilations, setCompilations] = useState<Compilation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [compilationToDelete, setCompilationToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompilations, setSelectedCompilations] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const fetchCompilations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/xbox/compilations');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCompilations(data.compilations || []);
    } catch (err) {
      console.error('Failed to fetch compilations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load compilations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompilations();
  }, []);

  const handleDownload = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleSelection = (name: string) => {
    const newSelection = new Set(selectedCompilations);
    if (newSelection.has(name)) {
      newSelection.delete(name);
    } else {
      newSelection.add(name);
    }
    setSelectedCompilations(newSelection);
  };

  const selectAll = () => {
    setSelectedCompilations(new Set(compilations.map(c => c.name)));
  };

  const clearSelection = () => {
    setSelectedCompilations(new Set());
    setIsSelectionMode(false);
  };

  const handleDeleteClick = (name: string) => {
    setCompilationToDelete(name);
    setDeleteModalOpen(true);
  };

  const handleDeleteSelected = () => {
    if (selectedCompilations.size === 0) return;
    setCompilationToDelete(`${selectedCompilations.size} compilation${selectedCompilations.size > 1 ? 's' : ''}`);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      // Determine what to delete:
      // - If we have selected compilations (multi-select mode), delete those
      // - Otherwise, delete the single compilation (from individual delete button)
      let toDelete: string[] = [];
      
      if (selectedCompilations.size > 0) {
        // Multi-select deletion
        toDelete = Array.from(selectedCompilations);
      } else if (compilationToDelete && !compilationToDelete.includes('compilation')) {
        // Single deletion (make sure it's not the display text like "2 compilations")
        toDelete = [compilationToDelete];
      }

      if (toDelete.length === 0) return;

      console.log(`Deleting ${toDelete.length} compilation(s):`, toDelete);

      // Delete all selected compilations
      const deletePromises = toDelete.map(name =>
        fetch(`/api/xbox/delete-compilation?name=${encodeURIComponent(name)}`, {
          method: 'DELETE',
        })
      );

      const results = await Promise.all(deletePromises);
      const failed = results.filter(r => !r.ok);

      if (failed.length > 0) {
        // Get error details from failed requests
        const errorDetails = await Promise.all(
          failed.map(async (r) => {
            try {
              const errorData = await r.json();
              return errorData.error || r.statusText;
            } catch {
              return r.statusText;
            }
          })
        );
        throw new Error(`Failed to delete ${failed.length} compilation(s): ${errorDetails.join(', ')}`);
      }

      // Close modal, clear selection, and refresh the list
      setDeleteModalOpen(false);
      setCompilationToDelete(null);
      setSelectedCompilations(new Set());
      setIsSelectionMode(false);
      await fetchCompilations();
    } catch (err) {
      console.error('Failed to delete compilation(s):', err);
      alert(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setDeleteModalOpen(false);
      setCompilationToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setCompilationToDelete(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-400">
        <p>Failed to load compilations: {error}</p>
        <button
          onClick={fetchCompilations}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (compilations.length === 0) {
    return (
      <div className="text-center p-8 text-gray-400">
        <p>No compilation videos yet. Create your first one from the Highlights section!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {compilations.length} Compilation{compilations.length !== 1 ? 's' : ''}
          {selectedCompilations.size > 0 && (
            <span className="ml-2 text-sm text-blue-400">
              ({selectedCompilations.size} selected)
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          {!isSelectionMode ? (
            <>
              <button
                onClick={() => setIsSelectionMode(true)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                ☑️ Select
              </button>
              <button
                onClick={fetchCompilations}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                🔄 Refresh
              </button>
            </>
          ) : (
            <>
              <button
                onClick={selectAll}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="text-gray-400 hover:text-gray-300 text-sm"
              >
                Cancel
              </button>
              {selectedCompilations.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="text-red-400 hover:text-red-300 text-sm font-semibold"
                >
                  🗑️ Delete ({selectedCompilations.size})
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {compilations.map((compilation) => {
          const isSelected = selectedCompilations.has(compilation.name);
          return (
            <div
              key={compilation.name}
              className={`bg-gray-800 rounded-lg overflow-hidden transition-all relative ${
                isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-gray-750'
              }`}
            >
              {isSelectionMode && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(compilation.name)}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>
              )}
              <div 
                className="aspect-video bg-gray-900 flex items-center justify-center cursor-pointer"
                onClick={() => isSelectionMode && toggleSelection(compilation.name)}
              >
                <video
                  src={compilation.url}
                  controls
                  preload="metadata"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-4 space-y-2">
                <p className="font-medium text-sm truncate" title={compilation.name}>
                  {compilation.name}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>{formatFileSize(compilation.size)}</span>
                  <span>{formatDate(compilation.createdOn)}</span>
                </div>
                {!isSelectionMode && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(compilation.url, compilation.name)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
                    >
                      ⬇️ Download
                    </button>
                    <button
                      onClick={() => handleDeleteClick(compilation.name)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
                      title="Delete compilation"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        compilationName={compilationToDelete || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
