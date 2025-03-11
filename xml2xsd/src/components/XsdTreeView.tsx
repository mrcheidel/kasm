import React from 'react';
import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react';

interface TreeNode {
  name: string;
  path: string;
  type: 'directory' | 'file';
  children?: TreeNode[];
}

interface XsdTreeViewProps {
  data: TreeNode[];
  onSelect: (path: string) => void;
}

interface TreeItemProps {
  node: TreeNode;
  onSelect: (path: string) => void;
}

const TreeItem: React.FC<TreeItemProps> = ({ node, onSelect }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleClick = () => {
    if (node.type === 'directory') {
      setIsOpen(!isOpen);
    } else {
      onSelect(node.path);
    }
  };

  return (
    <div className="ml-4">
      <div
        className={`flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100 ${
          node.type === 'file' ? 'text-gray-700' : 'text-gray-900 font-medium'
        }`}
        onClick={handleClick}
      >
        {node.type === 'directory' ? (
          <>
            <span className="mr-1">
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
            <Folder size={16} className="mr-2 text-blue-500" />
          </>
        ) : (
          <>
            <span className="mr-1 w-4" />
            <File size={16} className="mr-2 text-gray-500" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {node.type === 'directory' && isOpen && node.children && (
        <div className="ml-2">
          {node.children.map((child, index) => (
            <TreeItem key={index} node={child} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export const XsdTreeView: React.FC<XsdTreeViewProps> = ({ data, onSelect }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 max-h-80 overflow-y-auto">
      {data.map((node, index) => (
        <TreeItem key={index} node={node} onSelect={onSelect} />
      ))}
    </div>
  );
};