import React, { useState, useEffect } from 'react';
import { FileCheck, AlertCircle, CheckCircle, Code, FileCode, Server } from 'lucide-react';
import { XsdTreeView } from './components/XsdTreeView';

interface TreeNode {
  name: string;
  path: string;
  type: 'directory' | 'file';
  children?: TreeNode[];
}

function App() {
  const [xmlContent, setXmlContent] = useState<string>('');
  const [xsdContent, setXsdContent] = useState<string>('');
  const [xsdTree, setXsdTree] = useState<TreeNode[]>([]);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    errors?: string[];
    error?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const fetchXsdTree = async () => {
      try {
        const response = await fetch('/xsd-tree');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setXsdTree(data);
      } catch (error) {
        console.error('Error fetching XSD tree:', error);
        setXsdTree([]);
      }
    };

    fetchXsdTree();
    const interval = setInterval(fetchXsdTree, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('/health');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setServerStatus(data.status === 'ok' ? 'online' : 'offline');
      } catch (error) {
        console.error('Server health check error:', error);
        setServerStatus('offline');
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleXsdSelect = async (path: string) => {
    try {
      const response = await fetch(`/xsd-content/${path}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { content } = await response.json();
      setXsdContent(content);
    } catch (error) {
      console.error('Error fetching XSD content:', error);
    }
  };

  const handleValidate = async () => {
    if (!xmlContent || !xsdContent) {
      setValidationResult({
        success: false,
        message: 'Both XML and XSD content are required'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ xmlContent, xsdContent }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        success: false,
        message: 'Error connecting to validation server',
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleXmlFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setXmlContent(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const loadSampleData = () => {
    setXmlContent(`<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title>Harry Potter</title>
    <author>J.K. Rowling</author>
    <year>2005</year>
    <price>29.99</price>
  </book>
  <book category="web">
    <title>Learning XML</title>
    <author>Erik T. Ray</author>
    <year>2003</year>
    <price>39.95</price>
  </book>
</bookstore>`);

    setXsdContent(`<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="bookstore">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="book" maxOccurs="unbounded">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="title" type="xs:string"/>
              <xs:element name="author" type="xs:string"/>
              <xs:element name="year" type="xs:integer"/>
              <xs:element name="price" type="xs:decimal"/>
            </xs:sequence>
            <xs:attribute name="category" type="xs:string"/>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <FileCheck className="mr-2" size={24} />
            <h1 className="text-xl font-bold">XML Validator</h1>
          </div>
          <div className="flex items-center">
            <Server size={16} className="mr-1" />
            <span className={`text-sm ${
              serverStatus === 'online' 
                ? 'text-green-300' 
                : serverStatus === 'offline' 
                  ? 'text-red-300' 
                  : 'text-yellow-300'
            }`}>
              Server: {serverStatus === 'online' ? 'Online' : serverStatus === 'offline' ? 'Offline' : 'Checking...'}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="mb-6 flex justify-center">
          <button
            onClick={loadSampleData}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Load Sample Data
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* XML Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Code className="text-indigo-600 mr-2" size={20} />
              <h2 className="text-lg font-semibold">XML Content</h2>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload XML File
              </label>
              <input
                type="file"
                accept=".xml"
                onChange={handleXmlFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-600
                  hover:file:bg-indigo-100"
              />
            </div>
            
            <textarea
              value={xmlContent}
              onChange={(e) => setXmlContent(e.target.value)}
              placeholder="Paste your XML content here..."
              className="w-full h-80 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            />
          </div>

          {/* XSD Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FileCode className="text-indigo-600 mr-2" size={20} />
              <h2 className="text-lg font-semibold">XSD Content</h2>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select XSD from Server
              </label>
              <XsdTreeView data={xsdTree} onSelect={handleXsdSelect} />
            </div>
            
            <textarea
              value={xsdContent}
              onChange={(e) => setXsdContent(e.target.value)}
              placeholder="XSD content will appear here when selected from the tree..."
              className="w-full h-80 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm mt-4"
            />
          </div>
        </div>

        {/* Validation Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleValidate}
            disabled={isLoading || (!xmlContent || !xsdContent)}
            className={`px-6 py-3 rounded-md font-medium text-white ${
              isLoading || (!xmlContent || !xsdContent)
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            }`}
          >
            {isLoading ? 'Validating...' : 'Validate XML against XSD'}
          </button>
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className={`mt-8 p-4 rounded-md ${
            validationResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start">
              {validationResult.success ? (
                <CheckCircle className="text-green-500 mr-3 mt-0.5" size={20} />
              ) : (
                <AlertCircle className="text-red-500 mr-3 mt-0.5" size={20} />
              )}
              <div>
                <h3 className={`font-medium ${
                  validationResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validationResult.message}
                </h3>
                {validationResult.error && (
                  <p className="mt-1 text-sm text-red-700">{validationResult.error}</p>
                )}
                {validationResult.errors && validationResult.errors.length > 0 && (
                  <div className="mt-2">
                    <h4 className="font-medium text-red-800 mb-1">Validation Errors:</h4>
                    <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-4 mt-8">
        <div className="container mx-auto text-center text-gray-600 text-sm">
          @mrcheidel XML Validator Tool &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}

export default App;