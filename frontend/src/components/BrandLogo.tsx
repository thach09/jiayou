import {useState} from 'react';

/** Owner-approved raster artwork; transparent integrated wordmark sitting naturally on the surface. */
export function BrandLogo({compact=false}:{compact?:boolean}) {
  const [failed,setFailed]=useState(false);
  return <span className={`inline-flex shrink-0 items-center justify-start bg-transparent ${compact?'h-10 w-10':'h-10 w-[140px]'}`}>
    {failed ? <span className="font-sans text-base font-bold text-brand-ink">{compact?'J':'Jiayou'}</span> :
      <img src={compact?'/brand/jiayou-icon.png':'/brand/jiayou-wordmark-small.png'}
        srcSet={compact?undefined:'/brand/jiayou-wordmark-small.png 1x, /brand/jiayou-wordmark.png 2x'}
        width={compact?128:306} height={compact?128:98} alt="Jiayou" onError={()=>setFailed(true)}
        className="block h-full w-full object-contain" />}
  </span>;
}
