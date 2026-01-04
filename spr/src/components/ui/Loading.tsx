import React from 'react';
import { Zap } from 'lucide-react';

interface LoadingProps {
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = "神经连接初始化..." }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center space-y-8 animate-pulse">
      <Zap className="w-12 h-12 text-indigo-500" />
      <p className="font-black text-xl uppercase tracking-tighter opacity-40">
        {message}
      </p>
    </div>
  );
};

export default Loading;
