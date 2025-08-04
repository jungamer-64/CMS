/**
 * シンプルブロックエディター
 * LIB_COMMONIZATION_PLAN.md 対応
 */

'use client';

import React, { useState, useCallback } from 'react';

export interface Block {
  readonly id: string;
  readonly type: 'paragraph' | 'heading' | 'list' | 'image' | 'code';
  readonly content: string;
  readonly metadata?: Record<string, unknown>;
}

export interface BlockEditorProps {
  readonly blocks: Block[];
  readonly onChange: (blocks: Block[]) => void;
  readonly className?: string;
  readonly placeholder?: string;
}

export function SimpleBlockEditor({ 
  blocks, 
  onChange, 
  className, 
  placeholder = 'コンテンツを入力してください...' 
}: BlockEditorProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const updateBlock = useCallback((id: string, content: string) => {
    const newBlocks = blocks.map(block => 
      block.id === id ? { ...block, content } : block
    );
    onChange(newBlocks);
  }, [blocks, onChange]);

  const addBlock = useCallback(() => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type: 'paragraph',
      content: '',
    };
    onChange([...blocks, newBlock]);
  }, [blocks, onChange]);

  const removeBlock = useCallback((id: string) => {
    const newBlocks = blocks.filter(block => block.id !== id);
    onChange(newBlocks);
  }, [blocks, onChange]);

  return (
    <div className={`block-editor ${className ?? ''}`}>
      {blocks.length === 0 && (
        <div className="empty-editor p-4 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 text-center">{placeholder}</p>
          <button
            type="button"
            onClick={addBlock}
            className="mt-2 mx-auto block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            最初のブロックを追加
          </button>
        </div>
      )}
      
      {blocks.map((block) => (
        <button 
          key={block.id}
          type="button"
          className={`block-item mb-4 p-3 border rounded w-full text-left ${
            selectedBlockId === block.id ? 'border-blue-500' : 'border-gray-200'
          }`}
          onClick={() => setSelectedBlockId(block.id)}
        >
          <div className="block-controls mb-2 flex justify-between items-center">
            <select
              value={block.type}
              onChange={(e) => {
                const newBlocks = blocks.map(b => 
                  b.id === block.id 
                    ? { ...b, type: e.target.value as Block['type'] }
                    : b
                );
                onChange(newBlocks);
              }}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="paragraph">段落</option>
              <option value="heading">見出し</option>
              <option value="list">リスト</option>
              <option value="image">画像</option>
              <option value="code">コード</option>
            </select>
            
            <button
              type="button"
              onClick={() => removeBlock(block.id)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              削除
            </button>
          </div>
          
          <textarea
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            placeholder={`${block.type}の内容を入力...`}
            className="w-full p-2 border border-gray-300 rounded min-h-[100px] resize-vertical"
            rows={3}
          />
        </button>
      ))}
      
      {blocks.length > 0 && (
        <button
          type="button"
          onClick={addBlock}
          className="w-full mt-4 p-2 border-2 border-dashed border-gray-300 rounded hover:border-gray-400 text-gray-600 hover:text-gray-800"
        >
          + ブロックを追加
        </button>
      )}
    </div>
  );
}

// Backward compatibility
export const BlockEditor = SimpleBlockEditor;
