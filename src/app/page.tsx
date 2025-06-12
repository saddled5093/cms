
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Note, Category } from "@/types"; // Using updated types
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BarChartIcon, PieChartIcon, LineChart as LChartIcon, List, ArrowRight, CalendarDays, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts'; // Removed Tooltip from here
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isValid as isValidDateFn } from 'date-fns';
import { faIR } from 'date-fns/locale/fa-IR';
import { format as formatJalali } from 'date-fns-jalali';
import { useAuth } from "@/contexts/AuthContext";


const MAX_RECENT_NOTES = 5;

const aggregateData = (notes: Note[], groupBy: 'day' | 'province' | 'category', dateRange?: {start: Date, end: Date}) => {
  const aggregation: { [key: string]: number } = {};

  let filteredNotes = notes;
  if (dateRange && groupBy === 'day') {
    filteredNotes = notes.filter(note => {
      const noteEventDate = new Date(note.eventDate); // Already a Date object
      return isValidDateFn(noteEventDate) && noteEventDate >= dateRange.start && noteEventDate <= dateRange.end;
    });
  }

  filteredNotes.forEach(note => {
    if (groupBy === 'day' && dateRange) {
      const noteEventDate = new Date(note.eventDate);
      if (isValidDateFn(noteEventDate)) {
        const dayKey = formatJalali(noteEventDate, 'yyyy-MM-dd'); // Keep full date for sorting before formatting for display
        aggregation[dayKey] = (aggregation[dayKey] || 0) + 1;
      }
    } else if (groupBy === 'category') {
      note.categories.forEach(category => {
        if (category && category.name) { // Ensure category and category.name exist
          aggregation[category.name] = (aggregation[category.name] || 0) + 1;
        }
      });
    } else if (groupBy === 'province' && note.province) {
      const key = String(note.province).trim();
      if (key !== "") { 
         aggregation[key] = (aggregation[key] || 0) + 1;
      }
    }
  });

  if (groupBy === 'day' && dateRange) {
    const allDaysInMonth = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    allDaysInMonth.forEach(day => {
      const dayKey = formatJalali(day, 'yyyy-MM-dd');
      if (!aggregation[dayKey]) {
        aggregation[dayKey] = 0;
      }
    });
  }
  
  return Object.entries(aggregation)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => groupBy === 'day' ? a.name.localeCompare(b.name) : b.value - a.value); // Sort by name for days, by value for others
};


export default function DashboardPage() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingNotes(true);
    try {
      // API should handle fetching appropriate notes based on user role (e.g., only user's notes or all for admin)
      const response = await fetch(`/api/notes?userId=${currentUser.id}`); // Or some other logic if admin sees all
      if (!response.ok) {
        let errorDetails = 'Failed to fetch notes for dashboard';
        try {
          const errorData = await response.json(); 
          errorDetails = `API Error: ${errorData.error}${errorData.details ? ` - ${errorData.details}` : ''}`;
        } catch (e) {
          // If parsing error response fails, include status
          errorDetails += ` (Status: ${response.status})`;
        }
        throw new Error(errorDetails);
      }
      let fetchedNotes: any[] = await response.json();

      const processedNotes = fetchedNotes.map((note: any) => {
         let eventDt = note.eventDate ? parseISO(note.eventDate) : (note.createdAt ? parseISO(note.createdAt) : new Date());
         if (!isValidDateFn(eventDt)) eventDt = new Date(); // Fallback
         let createdDt = note.createdAt ? parseISO(note.createdAt) : new Date();
         if (!isValidDateFn(createdDt)) createdDt = new Date();
         let updatedDt = note.updatedAt ? parseISO(note.updatedAt) : new Date();
         if (!isValidDateFn(updatedDt)) updatedDt = new Date();

         return {
          ...note,
          eventDate: eventDt,
          createdAt: createdDt,
          updatedAt: updatedDt,
          categories: Array.isArray(note.categories) ? note.categories.map((c: any) => typeof c === 'string' ? {id: c, name: c} : (c && c.name ? c : {id: String(c), name: String(c)})) : [],
          tags: Array.isArray(note.tags) ? note.tags : [],
          province: note.province || "", 
          phoneNumbers: Array.isArray(note.phoneNumbers) ? note.phoneNumbers : [],
          isArchived: typeof note.isArchived === 'boolean' ? note.isArchived : false,
          isPublished: typeof note.isPublished === 'boolean' ? note.isPublished : false,
        } as Note;
      });
      setNotes(processedNotes);

    } catch (error: any) {
      console.error("Failed to load notes for dashboard from API:", error);
      toast({
        title: "خطا در بارگذاری داشبورد",
        description: error.message || "بارگذاری یادداشت‌ها برای داشبورد از سرور ممکن نبود.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingNotes(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (currentUser) {
        fetchDashboardData();
    }
  }, [currentUser, fetchDashboardData]);

  const recentNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt);
        const dateB = new Date(b.updatedAt);
        if(!isValidDateFn(dateA) && !isValidDateFn(dateB)) return 0;
        if(!isValidDateFn(dateA)) return 1;
        if(!isValidDateFn(dateB)) return -1;
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, MAX_RECENT_NOTES);
  }, [notes]);

  const notesByDayData = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const rawData = aggregateData(notes, 'day', { start: monthStart, end: monthEnd });
    return rawData.map(item => ({
      name: formatJalali(parseISO(item.name), 'dd'), // Format to day number for XAxis label
      originalDate: item.name, // Keep original for tooltip
      value: item.value
    }));
  }, [notes]);
  
  const notesByProvinceData = useMemo(() => aggregateData(notes, 'province').filter(p => p.name), [notes]);
  const notesByCategoryData = useMemo(() => aggregateData(notes, 'category').filter(c => c.name), [notes]);
  
  const CHART_COLORS = [
    'hsl(var(--chart-1))', 
    'hsl(var(--chart-2))', 
    'hsl(var(--chart-3))', 
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
  ];

  const dailyChartConfig = {
    value: { label: "تعداد یادداشت", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

  // For Pie and Bar charts where colors are per segment/bar
  const provinceChartConfig = notesByProvinceData.reduce((acc, entry, index) => {
    acc[entry.name] = { label: entry.name, color: CHART_COLORS[index % CHART_COLORS.length] };
    return acc;
  }, {} as ChartConfig);
  
  const categoryChartConfig = notesByCategoryData.slice(0,5).reduce((acc, entry, index) => {
    acc[entry.name] = { label: entry.name, color: CHART_COLORS[index % CHART_COLORS.length] };
    return acc;
  }, {} as ChartConfig);


  if (isAuthLoading || (isLoadingNotes && !notes.length && currentUser)) {
    return (
        <div className="container mx-auto p-4 md:p-8 text-center flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-lg text-foreground">در حال بارگذاری اطلاعات داشبورد...</p>
        </div>
    );
  }

  if (!currentUser && !isAuthLoading) {
    // This case should ideally be handled by AppLayout redirecting to /login
    return (
        <div className="container mx-auto p-4 md:p-8 text-center">
            <p className="text-lg text-destructive">برای مشاهده داشبورد ابتدا باید وارد شوید.</p>
             <Button asChild className="mt-4">
                <Link href="/login">رفتن به صفحه ورود</Link>
            </Button>
        </div>
    );
  }


  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-headline text-primary">داشبورد</h1>
        <Button asChild variant="outline">
          <Link href="/notes">
            مشاهده همه یادداشت‌ها
            <ArrowRight className="mr-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-lg font-headline text-primary flex items-center">
              <LChartIcon className="ml-2 h-5 w-5" />
              یادداشت‌های ماه جاری (روزانه)
            </CardTitle>
            <CardDescription>تعداد یادداشت‌های ایجاد شده (بر اساس تاریخ رویداد) در هر روز از ماه جاری</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {notesByDayData.length > 0 ? (
              <ChartContainer config={dailyChartConfig} className="w-full h-full">
                <LineChart data={notesByDayData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" tickFormatter={(tick) => `${tick}ام`} />
                  <YAxis stroke="hsl(var(--foreground))" allowDecimals={false}/>
                  <ChartTooltip
                    cursor={true}
                    content={<ChartTooltipContent 
                      indicator="line" 
                      labelFormatter={(_, payload) => {
                        if (payload && payload.length > 0 && payload[0].payload.originalDate) {
                           return `روز ${formatJalali(parseISO(payload[0].payload.originalDate), 'do MMMM', { locale: faIR })}`;
                        }
                        return '';
                      }}
                    />}
                  />
                  <Legend content={<ChartLegendContent />} />
                  <Line dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2} dot={{ fill: 'var(--color-value)' }} activeDot={{ r: 6, stroke: 'hsl(var(--background))', fill: 'var(--color-value)' }} nameKey="value" />
                </LineChart>
              </ChartContainer>
            ) : (
               <p className="text-muted-foreground text-center pt-10">داده‌ای برای نمایش وجود ندارد.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-lg font-headline text-primary flex items-center">
              <PieChartIcon className="ml-2 h-5 w-5" />
              یادداشت‌ها بر اساس استان
            </CardTitle>
            <CardDescription>پراکندگی یادداشت‌ها در استان‌های مختلف</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
           {notesByProvinceData.length > 0 ? (
            <ChartContainer config={provinceChartConfig} className="w-full h-full">
              <PieChart accessibilityLayer>
                <ChartTooltip 
                  cursor={false} 
                  content={<ChartTooltipContent hideLabel nameKey="name" />} 
                />
                <Pie data={notesByProvinceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (percent * 100) > 5 ? (
                      <text x={x} y={y} fill="hsl(var(--card-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px">
                        {`${name} (${(percent * 100).toFixed(0)}%)`}
                      </text>
                    ) : null;
                  }}
                >
                  {notesByProvinceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="hsl(var(--card))" name={entry.name}/>
                  ))}
                </Pie>
                <Legend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
            ) : (
               <p className="text-muted-foreground text-center pt-10">داده‌ای برای نمایش وجود ندارد.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-lg font-headline text-primary flex items-center">
              <BarChartIcon className="ml-2 h-5 w-5" />
              یادداشت‌ها بر اساس دسته‌بندی
            </CardTitle>
            <CardDescription>تعداد یادداشت‌ها در هر دسته‌بندی (۵ دسته‌بندی برتر)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {notesByCategoryData.slice(0, 5).length > 0 ? (
            <ChartContainer config={categoryChartConfig} className="w-full h-full">
              <BarChart data={notesByCategoryData.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--foreground))" allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--foreground))" width={80} tick={{fontSize: 10}}/>
                <ChartTooltip 
                  cursor={false} 
                  content={<ChartTooltipContent 
                    hideIndicator
                    labelFormatter={(label, payload) => {
                       if (payload && payload.length > 0) return payload[0].payload.name;
                       return label;
                    }}
                  />} 
                />
                <Bar dataKey="value" nameKey="name" barSize={20} radius={4}>
                   {notesByCategoryData.slice(0,5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} name={entry.name}/>
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            ) : (
               <p className="text-muted-foreground text-center pt-10">داده‌ای برای نمایش وجود ندارد.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <List className="ml-2 h-5 w-5" />
            یادداشت‌های اخیر
          </CardTitle>
          <CardDescription>نگاهی سریع به آخرین یادداشت‌های بروزرسانی شده شما.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentNotes.length > 0 ? (
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <Link href={`/notes#note-${note.id}`} key={note.id} className="block hover:bg-muted/30 p-3 rounded-md transition-colors">
                  <h3 className="font-semibold text-foreground">{note.title}</h3>
                   <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <CalendarDays className="ml-1.5 h-3.5 w-3.5" />
                        <span>تاریخ رویداد: {note.eventDate && isValidDateFn(new Date(note.eventDate)) ? formatJalali(new Date(note.eventDate), "PPP", { locale: faIR }) : 'ثبت نشده'}</span>
                   </div>
                  <p className="text-xs text-muted-foreground">
                    آخرین بروزرسانی: {note.updatedAt && isValidDateFn(new Date(note.updatedAt)) ? formatJalali(new Date(note.updatedAt), 'PPPp', { locale: faIR }) : 'نامشخص'}
                  </p>
                  <p className="text-sm text-foreground/80 mt-1 truncate">
                    {note.content.substring(0,100)}{note.content.length > 100 ? '...' : ''}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">هنوز یادداشتی ایجاد نشده است.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

