import React from 'react';
import { Card } from '@/components/ui/card';

interface UserCardProps {
  name: string;
  title: string;
  description: string;
  image?: string;
  sfaId?: string;
  cmsId?: string;
}

const UserCard = ({ name, title, description, image, sfaId, cmsId }: UserCardProps) => {
  return (
    <Card className="p-6 hover-lift transition-all duration-300 hover:shadow-dashboard-lg">
      <div className="flex flex-col items-center text-center space-y-4">
        {image && (
          <img
            src={image}
            alt={name}
            className="w-20 h-20 rounded-full object-cover border-2 border-primary"
          />
        )}
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-1">{name}</h3>
          <p className="text-primary font-medium mb-2">{title}</p>
          <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
          {(sfaId || cmsId) && (
            <div className="mt-3 space-y-1 text-xs text-text-muted">
              {sfaId && <div>SFA ID: {sfaId}</div>}
              {cmsId && <div>CMS ID: {cmsId}</div>}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default UserCard;