import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { 
  Folder, FolderOpen, File, FileText, FileCode, FileArchive,
  Download, Upload, Home,
  RefreshCw, ArrowLeft
} from 'lucide-react';
import SearchBar from '@components/common/SearchBar';
import SkeletonLoader from '@components/common/SkeletonLoader';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  permissions?: string;
  isExpanded?: boolean;
  children?: FileItem[];
}

interface FileExplorerProps {
  pod: {
    name: string;
    namespace: string;
    containers: Array<{ name: string }>;
  };
  selectedContainer: string;
  onFileDownload?: (file: FileItem) => void;
  onFileUpload?: (targetPath: string, file: File) => void;
}

const FileExplorer: FC<FileExplorerProps> = ({ 
  onFileDownload,
  onFileUpload 
}) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Mock file system data
  const mockFileSystem: FileItem[] = [
    {
      name: 'app',
      path: '/app',
      type: 'directory',
      children: [
        { name: 'main.go', path: '/app/main.go', type: 'file', size: 2048 },
        { name: 'config.yaml', path: '/app/config.yaml', type: 'file', size: 512 },
        { name: 'Dockerfile', path: '/app/Dockerfile', type: 'file', size: 256 },
      ]
    },
    {
      name: 'etc',
      path: '/etc',
      type: 'directory',
      children: [
        { name: 'passwd', path: '/etc/passwd', type: 'file', size: 1024 },
        { name: 'hosts', path: '/etc/hosts', type: 'file', size: 128 },
      ]
    },
    {
      name: 'var',
      path: '/var',
      type: 'directory',
      children: [
        {
          name: 'log',
          path: '/var/log',
          type: 'directory',
          children: [
            { name: 'app.log', path: '/var/log/app.log', type: 'file', size: 102400 },
            { name: 'error.log', path: '/var/log/error.log', type: 'file', size: 8192 },
          ]
        },
      ]
    },
    { name: 'config.json', path: '/config.json', type: 'file', size: 1024 },
    { name: 'README.md', path: '/README.md', type: 'file', size: 2048 },
  ];

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath]);

  const loadFiles = async (path: string) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (path === '/') {
        setFiles(mockFileSystem);
      } else {
        // Find the directory in mock file system
        const findDir = (items: FileItem[], targetPath: string): FileItem[] => {
          for (const item of items) {
            if (item.path === targetPath && item.children) {
              return item.children;
            }
            if (item.children) {
              const found = findDir(item.children, targetPath);
              if (found.length > 0) return found;
            }
          }
          return [];
        };
        setFiles(findDir(mockFileSystem, path));
      }
      setIsLoading(false);
    }, 500);
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'directory') {
      return file.isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />;
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'txt':
      case 'md':
      case 'log':
        return <FileText size={16} />;
      case 'js':
      case 'ts':
      case 'go':
      case 'py':
      case 'yaml':
      case 'json':
        return <FileCode size={16} />;
      case 'zip':
      case 'tar':
      case 'gz':
        return <FileArchive size={16} />;
      default:
        return <File size={16} />;
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'directory') {
      setCurrentPath(file.path);
    }
    // File click for files can be used for preview in the future
  };

  const handleDownload = (file: FileItem) => {
    // console.log('Downloading:', file.path);
    onFileDownload?.(file);
    
    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = file.name;
    link.click();
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // console.log('Uploading to:', currentPath, file);
    onFileUpload?.(currentPath, file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // console.log('Dropped files:', files);
      onFileUpload?.(currentPath, files[0]);
    }
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  const filteredFiles = searchQuery
    ? files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : files;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-white/20">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPath('/')}
            className="p-1 hover:bg-white/10 transition-colors"
            title="Home"
          >
            <Home size={16} />
          </button>
          <button
            onClick={() => {
              const parts = currentPath.split('/').filter(Boolean);
              parts.pop();
              const newPath = parts.length === 0 ? '/' : '/' + parts.join('/');
              setCurrentPath(newPath);
            }}
            disabled={currentPath === '/'}
            className="p-1 hover:bg-white/10 transition-colors disabled:opacity-30"
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={() => loadFiles(currentPath)}
            className="p-1 hover:bg-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        <SearchBar
          placeholder="Search files..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-64"
        />
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center p-2 border-b border-white/20 text-xs font-mono">
        <button
          onClick={() => setCurrentPath('/')}
          className="hover:text-green-400 transition-colors"
        >
          /
        </button>
        {pathParts.map((part, index) => (
          <span key={index}>
            <span className="mx-1 opacity-60">/</span>
            <button
              onClick={() => {
                const pathSegments = pathParts.slice(0, index + 1);
                const newPath = pathSegments.length === 0 ? '/' : '/' + pathSegments.join('/');
                setCurrentPath(newPath);
              }}
              className="hover:text-green-400 transition-colors"
            >
              {part}
            </button>
          </span>
        ))}
      </div>

      {/* File List */}
      <div 
        className={`flex-1 overflow-auto p-2 ${dragOver ? 'bg-green-400/10' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="h-32">
            <SkeletonLoader variant="table" count={5} />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-sm font-mono opacity-60">
            {searchQuery ? `No files matching "${searchQuery}"` : 'No files in this directory'}
          </div>
        ) : (
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left p-2 opacity-60">NAME</th>
                <th className="text-left p-2 opacity-60">SIZE</th>
                <th className="text-left p-2 opacity-60">TYPE</th>
                <th className="text-right p-2 opacity-60">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map(file => (
                <tr 
                  key={file.path}
                  className="border-b border-white/10 hover:bg-white/5 cursor-pointer"
                  onClick={() => handleFileClick(file)}
                >
                  <td className="p-2">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(file)}
                      <span className={file.type === 'directory' ? 'text-blue-400' : ''}>
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-2 opacity-60">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="p-2 opacity-60">
                    {file.type}
                  </td>
                  <td className="p-2 text-right">
                    {file.type === 'file' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file);
                        }}
                        className="px-2 py-1 text-xs border border-white/20 hover:bg-white hover:text-black transition-colors"
                      >
                        <Download size={12} className="inline mr-1" />
                        Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Area */}
      <div className="p-3 border-t border-white/20">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono opacity-60">
            Drop files here or click to upload to: {currentPath}
          </div>
          <label className="flex items-center space-x-2 px-3 py-1 border border-white hover:bg-white hover:text-black transition-colors font-mono cursor-pointer text-xs">
            <Upload size={12} />
            <span>Upload</span>
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;