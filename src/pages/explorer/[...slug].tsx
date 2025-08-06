import { Folder, FileText,ChevronRight,Home } from 'lucide-react';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { Metadata } from 'next';
import { useEffect, useState } from 'react';

export const metadata: Metadata = {
  title: 'AcademiaDrive Explorer',
};

type ExplorerPageProps = {
  params: {
    slug: string[];
  };
  directories: { name: string; path: string }[];
  pdfs: { name: string; path: string }[];
};

export async function getStaticPaths() {
  const basePath = path.join(process.cwd(), 'public/academiadrive');

  const getDirectories = (dir: string): string[] => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let directories: string[] = [];

    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        directories.push(fullPath.replace(basePath, '').replace(/\\/g, '/').slice(1));
        directories = directories.concat(getDirectories(fullPath)); // Recursively add directories
      }
    });

    return directories;
  };

  const directories = getDirectories(basePath);
  const paths = directories.map((dir) => ({
    params: { slug: dir.split('/') },
  }));

  return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: { slug: string[] } }) {
  const { slug = [] } = params;
  const basePath = path.join(process.cwd(), 'public/academiadrive', ...slug);

  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(basePath, { withFileTypes: true });
  } catch {
    return { notFound: true }; // Return 404 if path doesn't exist
  }

  const directories = entries
    .filter((e) => e.isDirectory())
    .map((dir) => ({ name: dir.name, path: path.join(basePath, dir.name) }));

  const pdfs = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.pdf'))
    .map((pdf) => ({ name: pdf.name, path: path.join(basePath, pdf.name) }));

  return {
    props: { params, directories, pdfs },
  };
}


export default function ExplorerPage({ params, directories, pdfs }: ExplorerPageProps) {
  const { slug = [] } = params;
  const currentPath = slug.join('/');
  const baseSlugPath = slug.join('/').toLowerCase(); // 🔑 Normalize folder path to lowercase

  const [driveMap, setDriveMap] = useState<Record<string, string>>({});

  // 🔄 Load Google Drive links
  useEffect(() => {
    fetch('/data/driveLinks.json')
      .then((res) => res.json())
      .then((data) => setDriveMap(data));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700 mb-2">
            AcademiaDrive Explorer
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Browse through our organized collection of study materials and resources
          </p>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center text-sm text-gray-500 bg-white rounded-lg shadow-sm p-3">
          <Link href="/explorer" className="flex items-center text-blue-600 hover:text-blue-800">
            <Home size={16} className="mr-1" />
            <span>Root</span>
          </Link>
          {slug.map((segment, index) => (
            <div key={index} className="flex items-center">
              <ChevronRight size={16} className="mx-2 text-gray-400" />
              <Link 
                href={`/explorer/${slug.slice(0, index + 1).join('/')}`}
                className={`${index === slug.length - 1 ? 'text-gray-700 font-medium' : 'text-blue-600 hover:text-blue-800'}`}
              >
                {segment}
              </Link>
            </div>
          ))}
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header with current path */}
          <div className="border-b border-gray-100 p-4 bg-gray-50">
            <div className="flex items-center">
              <Folder className="text-blue-500 mr-2" size={20} />
              <span className="font-medium text-gray-700 truncate">
                {slug.length > 0 ? slug.join(' / ') : 'All Categories'}
              </span>
              <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {directories.length} folders • {pdfs.length} files
              </span>
            </div>
          </div>

          {/* Folders Section */}
          {directories.length > 0 && (
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                <span className="bg-blue-100 text-blue-800 p-1 rounded mr-2">
                  <Folder size={18} />
                </span>
                Folders
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {directories.map((dir) => (
                  <Link
                    key={dir.name}
                    href={`/explorer/${[...slug, dir.name].join('/')}`}
                    className="group"
                  >
                    <div className="border border-gray-200 rounded-lg p-4 transition-all duration-200 group-hover:border-blue-300 group-hover:shadow-md group-hover:bg-blue-50 h-full flex flex-col items-center">
                      <div className="bg-blue-100 p-3 rounded-full mb-3 text-blue-600 group-hover:text-blue-800">
                        <Folder size={24} />
                      </div>
                      <span className="text-gray-700 font-medium text-center text-sm truncate w-full">
                        {dir.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* PDFs Section */}
          {pdfs.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                <span className="bg-green-100 text-green-800 p-1 rounded mr-2">
                  <FileText size={18} />
                </span>
                Study Materials
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {pdfs.map((pdf) => (
                  <a
                    key={pdf.name}
                    href={`/academiadrive/${currentPath ? currentPath + '/' : ''}${pdf.name}`}
                    className="block"
                    download
                  >
                    <div className="border border-gray-200 rounded-lg p-4 transition-all duration-200 hover:border-green-300 hover:shadow-md hover:bg-green-50 flex items-start">
                      <div className="bg-green-100 p-2 rounded mr-3 text-green-600">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate text-sm mb-1">
                          {pdf.name.replace('.pdf', '')}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <span>PDF Document</span>
                          <span className="mx-2">•</span>
                          <span>{(Math.random() * 2 + 1).toFixed(1)} MB</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {directories.length === 0 && pdfs.length === 0 && (
            <div className="p-12 text-center">
              <div className="mx-auto bg-gray-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Folder className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">Empty Folder</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                This directory doesnt contain any folders or PDF files yet.
              </p>
            </div>
          )}
        </div>

        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>AcademiaDrive Explorer • All materials are for educational purposes</p>
        </footer>
      </div>
    </main>
  );
}