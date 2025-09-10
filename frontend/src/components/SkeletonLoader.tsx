import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

const Skeleton = ({ className = '', animate = true }: SkeletonProps) => {
  const baseClasses = 'bg-gray-200 rounded';
  const animationClasses = animate ? 'animate-pulse' : '';
  
  return (
    <div className={`${baseClasses} ${animationClasses} ${className}`} />
  );
};

// Skeleton para card de voo
export const FlightCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-6 w-16" />
        </div>
        
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-1 w-16" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        <div className="space-y-2 text-right">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
};

// Skeleton para lista de voos
export const FlightListSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <FlightCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Skeleton para formulário de busca
export const SearchFormSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-12 w-32" />
      </div>
    </div>
  );
};

// Skeleton para perfil de usuário
export const ProfileSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
};

// Skeleton para tabela
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 4 
}: { 
  rows?: number; 
  columns?: number; 
}) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-20" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Skeleton para estatísticas/métricas
export const StatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6 space-y-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;