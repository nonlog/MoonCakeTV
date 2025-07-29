import { Calendar, Globe, Play } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface MediaCardProps {
  id: string | number;
  mc_id: string;
  cover_image?: string | null;
  title: string;
  summary?: string | null;
  category?: string | null;
  language?: string | null;
  year?: string | number | null;
  region?: string | null;
  casting?: string | null;
  onClick?: () => void;
}

export function MediaCard({
  id,
  mc_id,
  cover_image,
  title,
  summary,
  category,
  language,
  year,
  region,
  casting,
  onClick,
}: MediaCardProps) {
  return (
    <Card
      key={id}
      className='group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden'
      onClick={onClick}
    >
      <div className='relative'>
        {cover_image ? (
          <div className='aspect-[3/4] overflow-hidden'>
            <img
              key={mc_id}
              src={cover_image}
              alt={title}
              loading='lazy'
              className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className='hidden aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 justify-center items-center'>
              <Play className='w-12 h-12 text-slate-400' />
            </div>
          </div>
        ) : (
          <div className='aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center'>
            <Play className='w-12 h-12 text-slate-400' />
          </div>
        )}
        <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100'>
          <Play className='w-8 h-8 text-white' />
        </div>
      </div>

      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-medium line-clamp-2 leading-tight'>
          {title}
        </CardTitle>
        {summary && (
          <CardDescription className='text-xs line-clamp-2'>
            {summary}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className='pt-0 space-y-2'>
        <div className='flex flex-wrap gap-1'>
          {category && (
            <Badge variant='secondary' className='text-xs px-2 py-0.5'>
              {category}
            </Badge>
          )}
          {language && (
            <Badge variant='outline' className='text-xs px-2 py-0.5'>
              <Globe className='w-3 h-3 mr-1' />
              {language}
            </Badge>
          )}
        </div>

        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          {year && (
            <div className='flex items-center gap-1'>
              <Calendar className='w-3 h-3' />
              <span>{year}</span>
            </div>
          )}
          {region && <span className='truncate'>{region}</span>}
        </div>

        {casting && casting.length > 0 && (
          <div className='text-xs text-muted-foreground'>
            <span className='font-medium'>演员: </span>
            <span className='line-clamp-1'>{casting}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
