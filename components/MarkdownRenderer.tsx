
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const renderContent = () => {
    return content.split('\n').map((line, index) => {
      // Headings
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-semibold mt-4 mb-2 text-sky-300">{line.substring(4)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-bold mt-6 mb-3 text-sky-400 border-b border-slate-600 pb-2">{line.substring(3)}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold mt-8 mb-4 text-sky-500 border-b-2 border-slate-500 pb-2">{line.substring(2)}</h1>;
      }

      // List items
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return <li key={index} className="ml-6 list-disc">{line.substring(2)}</li>;
      }
      
      // Empty line for spacing
      if (line.trim() === '') {
        return <div key={index} className="h-4"></div>;
      }

      // Bold text using regex to find all occurrences
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-slate-100">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return <p key={index} className="my-2 leading-relaxed">{renderedParts}</p>;
    });
  };

  return (
    <div className="prose prose-invert max-w-none text-slate-300">
      {renderContent()}
    </div>
  );
};

export default MarkdownRenderer;
