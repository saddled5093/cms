
"use client";

import { useState, useEffect } from 'react';
import { format as formatJalali, formatDistanceToNowStrict } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';
import { isValid as isValidDateFn, parseISO } from 'date-fns';

interface InteractiveDateDisplayProps {
  date: Date | string | null | undefined;
  format?: string; // e.g., 'yyyy/M/d HH:mm'
  className?: string;
}

export default function InteractiveDateDisplay({ date, format = 'yyyy/M/d HH:mm', className }: InteractiveDateDisplayProps) {
  const [showTimeAgo, setShowTimeAgo] = useState(false);
  const [processedDate, setProcessedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (date) {
      const d = typeof date === 'string' ? parseISO(date) : date;
      if (isValidDateFn(d)) {
        setProcessedDate(d);
      } else {
        setProcessedDate(null);
      }
    } else {
      setProcessedDate(null);
    }
  }, [date]);

  if (!processedDate) {
    return <span className={className}>تاریخ نامعتبر</span>;
  }

  const toggleDisplay = () => {
    setShowTimeAgo(prev => !prev);
  };

  const formattedDate = formatJalali(processedDate, format, { locale: faIR });
  const timeAgo = formatDistanceToNowStrict(processedDate, { addSuffix: true, locale: faIR });

  return (
    <span onClick={toggleDisplay} className={`cursor-pointer hover:underline ${className}`} title="برای تغییر نحوه نمایش کلیک کنید">
      {showTimeAgo ? timeAgo : formattedDate}
    </span>
  );
}

    