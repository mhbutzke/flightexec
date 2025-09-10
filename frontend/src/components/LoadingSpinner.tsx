import { motion } from 'framer-motion';
import { Loader2, PlaneTakeoff } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'plane' | 'dots';
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'default', 
  text, 
  className = '' 
}: LoadingSpinnerProps) => {
  const renderSpinner = () => {
    switch (variant) {
      case 'plane':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className={`${sizeClasses[size]} text-blue-600`}
          >
            <PlaneTakeoff className="w-full h-full" />
          </motion.div>
        );
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'} bg-blue-600 rounded-full`}
              />
            ))}
          </div>
        );
      
      default:
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className={`${sizeClasses[size]} text-blue-600`}
          >
            <Loader2 className="w-full h-full" />
          </motion.div>
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      {renderSpinner()}
      {text && (
        <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
          {text}
        </p>
      )}
    </div>
  );
};

// Componente de loading para páginas inteiras
export const PageLoader = ({ text = 'Carregando...' }: { text?: string }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="xl" variant="plane" text={text} />
      </div>
    </div>
  );
};

// Componente de loading para botões
export const ButtonLoader = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => {
  return (
    <LoadingSpinner 
      size={size} 
      variant="default" 
      className="inline-flex" 
    />
  );
};

// Componente de loading para cards/seções
export const SectionLoader = ({ 
  text = 'Carregando dados...', 
  height = 'h-32' 
}: { 
  text?: string; 
  height?: string; 
}) => {
  return (
    <div className={`${height} flex items-center justify-center bg-white rounded-lg border border-gray-200`}>
      <LoadingSpinner size="lg" variant="dots" text={text} />
    </div>
  );
};

export default LoadingSpinner;