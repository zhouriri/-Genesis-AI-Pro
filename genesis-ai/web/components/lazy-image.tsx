'use client';

import { useState, useRef, useEffect, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderSrc?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * 懒加载图片组件
 * 使用 Intersection Observer API 实现图片懒加载
 * 支持自定义占位图、加载阈值、根边距
 */
export function LazyImage({
  src,
  alt,
  placeholderSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWYxZjJmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj48L3RleHQ+PC9zdmc+',
  threshold = 0.1,
  rootMargin = '200px',
  className,
  onLoad,
  onError,
  ...rest
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const currentImg = imgRef.current;
    if (!currentImg) return;

    // 创建 Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(currentImg);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ aspectRatio: rest.width && rest.height ? `${rest.width} / ${rest.height}` : 'auto' }}
    >
      {/* 占位图 */}
      <img
        src={placeholderSrc}
        alt=""
        aria-hidden="true"
        className={cn(
          'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-0' : 'opacity-100'
        )}
      />

      {/* 实际图片 */}
      {isInView && (
        <img
          ref={imgRef}
          src={hasError ? placeholderSrc : src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
          decoding="async"
          {...rest}
        />
      )}

      {/* 加载中动画 */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-[var(--card)]"
          aria-hidden="true"
        >
          <div className="w-8 h-8 border-2 border-[var(--muted)] border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
