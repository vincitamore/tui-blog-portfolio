import React from 'react';

interface TuiScreenProps {
  title: string;
  children: React.ReactNode;
  back?: boolean;
}

const TuiScreen: React.FC<TuiScreenProps> = ({ title, children, back = false }) => (
  <div className="h-full flex flex-col justify-center items-center p-8 select-none">
    <pre className="border-4 border-ansi-green p-12 text-lg leading-relaxed max-w-4xl h-96 flex flex-col justify-center font-mono shadow-2xl">
      <div className="text-3xl font-bold mb-12 text-center tracking-wide">{title}</div>
      <div className="flex-1 flex items-center justify-center text-xl opacity-90 mb-12">
        {children}
      </div>
      {back && (
        <div className="text-center text-xs tracking-wider opacity-75">
          Press ⎋ Esc to return to main menu
        </div>
      )}
    </pre>
  </div>
);

export default TuiScreen;
